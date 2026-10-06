import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { validLocation, storedLocation, networkAllowed } from '../../shared/locationPolicy.ts';
import { publicRecruitment, publicRecruitmentQuery } from '../../shared/recruitmentPolicy.ts';
import { safeMemberName } from '../../shared/memberAccess.ts';
import { stableIdentityInput } from '../../shared/stableIdentityInput.ts';

// Builds the Messages landing lists for the signed-in user:
//  - conversations: one row per person they've already talked to, newest first
//  - nearby: EVERY other member who is reachable — same Wi-Fi network (matched
//    by a hashed network address recorded on each visit, no GPS needed), shared
//    map location, or active on the band board. Same-network people always rank
//    first, then real distance. Coordinates are never sent back exactly — only
//    ~1km-coarse pins and rounded km distances.

const NETWORK_WINDOW_MS = 24 * 60 * 60 * 1000; // "on the same Wi-Fi" = seen within 24h
const ONLINE_WINDOW_MS = 5 * 60 * 1000;        // "online" = active in the last 5 minutes

function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// The raw IP is never stored — only a short one-way hash used for equality.
async function networkHash(ip) {
  const data = stableIdentityInput('net', ip);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Optional city-level network estimate, only after separate network opt-in.
// This lookup discloses the public IP to ipwho.is; see the location agreement.
async function ipGeocode(ip) {
  if (!ip) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const d = await res.json();
    if (!d || d.success === false) return null;
    if (typeof d.latitude !== 'number' || typeof d.longitude !== 'number') return null;
    return { lat: d.latitude, lng: d.longitude };
  } catch { return null; }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (body.session_location != null && !validLocation(body.session_location)) {
      return Response.json({ error: 'Invalid session location' }, { status: 400 });
    }
    // Visit-only coordinates are used for this response, never written to User.
    const sessionLoc = user.location_consent === 'session' && body.session_location
      ? { lat: Math.round(body.session_location.lat * 1000) / 1000, lng: Math.round(body.session_location.lng * 1000) / 1000 }
      : null;
    const svc = base44.asServiceRole;

    // Per-peer "last seen" map drives per-conversation unread counts. A legacy
    // single ISO string (old global timestamp) is honoured so existing users
    // don't suddenly see every old message as unread.
    const seenRaw = user.messages_last_seen;
    const seenMap = (typeof seenRaw === 'object' && seenRaw && !Array.isArray(seenRaw)) ? seenRaw : {};
    const legacyGlobal = (typeof seenRaw === 'string' && seenRaw) ? new Date(seenRaw) : null;
    const lastSeenFor = (peer) => seenMap[peer] ? new Date(seenMap[peer]) : (legacyGlobal || new Date(0));
    // Fingerprint the caller's network (same Wi-Fi = same public address) and
    // remember it on their record so friends on the same network find each other.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
      || req.headers.get('cf-connecting-ip') || '';
    const allowNetwork = networkAllowed(user);
    const myNet = allowNetwork && ip ? await networkHash(ip) : null;
    const now = Date.now();
    // Heartbeat: every visit refreshes last_active, which is what makes someone
    // "online" for everyone else (and what their last-known position is dated by).
    await svc.entities.User.update(user.id, {
      last_active: new Date(now).toISOString(),
      ...(myNet ? { network_id: myNet, network_seen: new Date(now).toISOString() } : { network_id: null, network_seen: null }),
    });

    const [messages, posts, users] = await Promise.all([
      svc.entities.ChatMessage.list('-created_date', 500),
      svc.entities.RecruitPost.filter(publicRecruitmentQuery(), '-created_date', 200),
      svc.entities.User.list(),
    ]);

    // Resolve every member's current display name so peer names never fall
    // back to their email address (privacy).
    const nameByEmail = new Map();
    for (const u of users) {
      if (u.email) nameByEmail.set(u.email, u.display_name || u.full_name || '');
    }

    const myMessages = messages.filter(m => (m.chat_id || '').split('|').includes(user.email));
    const conversations = [];
    const byPeer = new Map();
    for (const m of myMessages) {
      const parts = (m.chat_id || '').split('|');
      const peer = parts.find(e => e !== user.email) || user.email;
      if (!byPeer.has(peer)) {
        const row = {
          peer_email: peer,
          peer_name: nameByEmail.get(peer) || '',
          last_message: m.content || '',
          last_at: m.created_date,
          from_me: m.sender_email === user.email,
          unread: 0,
        };
        byPeer.set(peer, row);
        conversations.push(row);
      }
      const row = byPeer.get(peer);
      if (m.sender_email !== user.email) {
        if (m.sender_name && !row.peer_name) row.peer_name = m.sender_name;
        if (new Date(m.created_date) > lastSeenFor(peer)) row.unread = (row.unread || 0) + 1;
      }
    }

    const myPosts = posts.filter(p => p.author_email === user.email);
    const myCity = myPosts.find(p => p.city)?.city || '';

    // Only publicly approved posts can supply discovery metadata.
    const postByEmail = new Map();
    for (const p of posts) {
      if (p.author_email && publicRecruitment(p) && !postByEmail.has(p.author_email)) {
        postByEmail.set(p.author_email, p);
      }
    }

    const storedLoc = storedLocation(user);
    const ipLoc = !storedLoc && !sessionLoc && allowNetwork ? await ipGeocode(ip) : null;
    const mine = sessionLoc || storedLoc || ipLoc;
    const locationSource = sessionLoc ? (body.session_location.source === 'manual' ? 'manual' : 'device')
      : storedLoc ? (user.location_source === 'manual' ? 'manual' : 'device') : ipLoc ? 'ip' : null;

    const onMyNetwork = (u) =>
      !!myNet && networkAllowed(u) && u.network_id === myNet && u.network_seen &&
      (now - new Date(u.network_seen).getTime()) < NETWORK_WINDOW_MS;

    let nearby = [];
    for (const u of users) {
      if (!u.email || u.email === user.email) continue;
      const post = postByEmail.get(u.email) || null;

      const net = onMyNetwork(u);
      const theirs = storedLocation(u);

      // Reachable = same Wi-Fi, or has a shared location, or is on the board.
      if (!net && !theirs && !post) continue;

      let km = null;
      if (mine && theirs) km = distanceKm(mine.lat, mine.lng, theirs.lat, theirs.lng);
      // Sharing a network does not establish a physical distance.

      // Only consented saved positions become approximate ~1 km pins.
      // Never invent a peer's location from a matching public network address.
      const src = theirs;
      const coarse = src && (mine || net)
        ? { lat: Math.round(src.lat * 100) / 100, lng: Math.round(src.lng * 100) / 100 }
        : null;

      // Online = heartbeat within the last 5 minutes. Only consented saved
      // positions remain visible when a member is offline.
      const lastActive = u.last_active || u.network_seen || null;
      const online = !!lastActive && (now - new Date(lastActive).getTime()) < ONLINE_WINDOW_MS;

      nearby.push({
        id: u.id,
        lat: coarse?.lat ?? null,
        lng: coarse?.lng ?? null,
        online,
        last_active: lastActive,
        location_updated: theirs ? (u.location_updated || null) : null,
        email: u.email,
        picture_url: u.profile_picture_url || '',
        name: safeMemberName(u),
        city: post?.city || '',
        school: post?.school || '',
        kind: post?.kind || null,
        title: post?.title || '',
        same_network: net,
        distance_km: km === null ? null : km < 1 ? Math.round(km * 100) / 100 : Math.round(km * 10) / 10,
      });
    }

    nearby.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      if (a.same_network !== b.same_network) return a.same_network ? -1 : 1;
      if (a.distance_km === null) return b.distance_km === null ? 0 : 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });
    nearby = nearby.slice(0, 16);

    const sameCity = myCity
      ? nearby.some(n => (n.city || '').toLowerCase() === myCity.toLowerCase())
      : false;

    return Response.json({
      conversations: conversations.slice(0, 25),
      nearby,
      my_city: myCity,
      matched_city: sameCity,
      located: !!mine,
      location_source: locationSource,
      network_active: !!myNet,
      // The viewer's consented, approximate position centres their own map.
      my_lat: mine ? mine.lat : null,
      my_lng: mine ? mine.lng : null,
      located_count: nearby.filter(n => n.distance_km !== null).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}