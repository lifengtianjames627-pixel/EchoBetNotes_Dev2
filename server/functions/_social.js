import { createHash } from 'node:crypto';
import { HttpError } from '../entities/policies.js';
import { buildChatMessage, lastSeenFor } from '../shared/chatPolicy.js';
import { chatIdFor, normalizeEmail, onlineRecently, safeMemberName } from '../shared/identity.js';
import { records, requireAdmin, requireUser } from './_helpers.js';

const findUser = async ({ id, email }) => {
  if (id) return records('User').find(id);
  if (email) return (await records('User').list({ filter: { email: normalizeEmail(email) }, limit: 1 }))[0] || null;
  return null;
};

export async function publicProfile(context, payload) {
  const viewer = requireUser(context);
  if (!payload.user_id && !payload.email) throw new HttpError(400, 'missing_identifier');
  const user = await findUser({ id: payload.user_id, email: payload.email });
  if (!user) return { found: false };
  return {
    found: true,
    id: user.id,
    email: user.email,
    full_name: safeMemberName(user),
    profile_picture_url: user.profile_picture_url || '',
    equipped_badges: user.equipped_badges || [],
    last_active: user.last_active,
    online: onlineRecently(user.last_active),
    is_me: user.id === viewer.id,
  };
}

export async function searchUsers(context, payload) {
  const viewer = requireUser(context);
  const query = String(payload.query || '').trim().toLowerCase();
  if (query.length < 2 || query.length > 100 || query.includes('@')) return { results: [] };
  const users = await records('User').list({ limit: 1000 });
  return {
    results: users
      .filter((user) => user.id !== viewer.id && safeMemberName(user).toLowerCase().includes(query))
      .slice(0, 10)
      .map((user) => ({ id: user.id, full_name: safeMemberName(user) })),
  };
}

export async function resolveProfiles(context, payload) {
  requireUser(context);
  const emails = [...new Set((payload.emails || []).map(normalizeEmail))].slice(0, 100);
  if (!emails.length) return { results: {} };
  const users = await records('User').list({ filter: { email: { $in: emails } }, limit: 100 });
  return {
    results: Object.fromEntries(users.map((user) => [
      normalizeEmail(user.email),
      { name: safeMemberName(user), picture_url: user.profile_picture_url || '' },
    ])),
  };
}

export async function getEquippedBadges(context, payload) {
  requireUser(context);
  const profiles = await resolveProfiles(context, payload);
  const emails = Object.keys(profiles.results);
  const users = emails.length
    ? await records('User').list({ filter: { email: { $in: emails } }, limit: 100 })
    : [];
  return { badges: Object.fromEntries(users.map((user) => [user.email, user.equipped_badges || []])) };
}

export async function sendChatMessage(context, payload) {
  const user = requireUser(context);
  const draft = buildChatMessage(user, payload);
  const peerEmail = draft.participants.find((item) => item !== normalizeEmail(user.email));
  const peer = await findUser({ email: peerEmail });
  if (!peer) throw new HttpError(404, 'member_unavailable');
  const friendship = await records('FriendRequest').list({
    filter: {
      $or: [
        { from_email: user.email, to_email: peerEmail, status: 'accepted' },
        { from_email: peerEmail, to_email: user.email, status: 'accepted' },
      ],
    },
    limit: 1,
  });
  if (!friendship.length) {
    const sent = await records('ChatMessage').list({
      filter: { chat_id: draft.chat_id, sender_email: user.email },
      limit: 4,
    });
    const maximum = payload.context === 'profile' ? 1 : 3;
    if (sent.length >= maximum) throw new HttpError(403, 'message_limit');
  }
  return { message: await records('ChatMessage').create(draft, user) };
}

export async function messageUnread(context) {
  const user = requireUser(context);
  const messages = await records('ChatMessage').list({ sort: '-created_date', limit: 1000 });
  const unread = messages.filter((message) => {
    if (!message.participants?.map(normalizeEmail).includes(normalizeEmail(user.email))) return false;
    if (normalizeEmail(message.sender_email) === normalizeEmail(user.email)) return false;
    return new Date(message.created_date).getTime() > lastSeenFor(user, normalizeEmail(message.sender_email));
  }).length;
  return { unread };
}

export async function chatDirectory(context) {
  const user = requireUser(context);
  const messages = await records('ChatMessage').list({ sort: '-created_date', limit: 500 });
  const relevant = messages.filter((message) => message.participants?.map(normalizeEmail).includes(normalizeEmail(user.email)));
  const conversations = new Map();
  for (const message of relevant) {
    const peer = message.participants.map(normalizeEmail).find((item) => item !== normalizeEmail(user.email));
    if (!peer || conversations.has(peer)) continue;
    conversations.set(peer, {
      peer_email: peer,
      peer_name: message.sender_email === peer ? message.sender_name : peer,
      last_message: message.content || message.attachment_name || '',
      last_at: message.created_date,
      from_me: normalizeEmail(message.sender_email) === normalizeEmail(user.email),
      unread: normalizeEmail(message.sender_email) === peer
        && new Date(message.created_date).getTime() > lastSeenFor(user, peer),
    });
  }
  const users = await records('User').list({ limit: 1000 });
  const nearby = users
    .filter((candidate) => candidate.id !== user.id)
    .slice(0, 16)
    .map((candidate) => ({
      id: candidate.id,
      email: candidate.email,
      name: safeMemberName(candidate),
      picture_url: candidate.profile_picture_url || '',
      online: onlineRecently(candidate.last_active),
      last_active: candidate.last_active,
    }));
  await records('User').update(user.id, { last_active: new Date().toISOString() });
  return {
    conversations: [...conversations.values()].slice(0, 25),
    nearby,
    located: false,
    network_active: false,
    located_count: 0,
  };
}

export async function friendRequests(context, payload) {
  const user = requireUser(context);
  if (payload.action === 'send') {
    const target = await findUser({ id: payload.target_id, email: payload.target_email });
    if (!target) throw new HttpError(404, 'member_unavailable');
    if (target.id === user.id) throw new HttpError(400, 'self_request');
    const message = String(payload.message || '').slice(0, 1000);
    const existing = await records('FriendRequest').list({
      filter: {
        $or: [
          { from_email: user.email, to_email: target.email },
          { from_email: target.email, to_email: user.email },
        ],
      },
      sort: '-created_date',
      limit: 1,
    });
    if (existing[0] && ['pending', 'accepted'].includes(existing[0].status)) {
      return { request: existing[0], created: false };
    }
    const request = await records('FriendRequest').create({
      from_email: user.email,
      from_name: safeMemberName(user),
      to_email: target.email,
      to_name: safeMemberName(target),
      message,
      status: 'pending',
    }, user);
    return { request, created: true };
  }
  if (payload.action === 'respond') {
    const request = await records('FriendRequest').find(payload.id);
    if (!request) throw new HttpError(404, 'not_found');
    if (normalizeEmail(request.to_email) !== normalizeEmail(user.email)) throw new HttpError(403, 'forbidden');
    if (request.status !== 'pending') throw new HttpError(409, 'already_resolved');
    if (!['accepted', 'declined'].includes(payload.status)) throw new HttpError(400, 'invalid_response');
    return { request: await records('FriendRequest').update(request.id, { status: payload.status }) };
  }
  throw new HttpError(400, 'invalid_action');
}

export async function notifications(context, payload) {
  const user = requireUser(context);
  const action = payload.action || 'list';
  if (action === 'list') {
    const items = await records('Notification').list({
      filter: { owner_email: user.email },
      sort: '-created_date',
      limit: 100,
    });
    return { items, unread: items.filter((item) => !item.read).length };
  }
  if (action === 'markAll') {
    await records('Notification').updateMany({ owner_email: user.email, read: false }, { read: true });
    return { ok: true };
  }
  if (action === 'markRead') {
    const item = await records('Notification').find(payload.id);
    if (!item || normalizeEmail(item.owner_email) !== normalizeEmail(user.email)) throw new HttpError(404, 'not_found');
    await records('Notification').update(item.id, { read: true });
    return { ok: true };
  }
  if (action === 'create') {
    if (normalizeEmail(payload.owner_email) === normalizeEmail(user.email)) return { skipped: true };
    if (['badge', 'ranking', 'system'].includes(payload.type) && user.role !== 'admin') {
      throw new HttpError(403, 'forbidden');
    }
    const notification = await records('Notification').create({
      owner_email: normalizeEmail(payload.owner_email),
      type: payload.type,
      title: String(payload.title || '').slice(0, 200),
      body: String(payload.body || '').slice(0, 1000),
      link: String(payload.link || '/').startsWith('/') ? payload.link : '/',
      actor_name: safeMemberName(user),
      read: false,
    }, user);
    return { ok: true, id: notification.id };
  }
  throw new HttpError(400, 'invalid_action');
}

export async function propagateProfile(context) {
  const user = requireUser(context);
  const name = safeMemberName(user);
  const tasks = [
    ['Review', { reviewer_email: user.email }, { reviewer_name: name }],
    ['RecruitPost', { author_email: user.email }, { author_name: name }],
    ['Comment', { author_email: user.email }, { author_name: name }],
    ['ChatMessage', { sender_email: user.email }, { sender_name: name }],
    ['Subscription', { subscriber_email: user.email }, { subscriber_name: name }],
  ];
  await Promise.all(tasks.map(([entityName, filter, changes]) => records(entityName).updateMany(filter, changes)));
  return { ok: true, name };
}

export async function trackGenre(context, payload) {
  const user = requireUser(context);
  if (!payload.genre) throw new HttpError(400, 'missing_genre');
  const current = (await records('GenreTally').list({
    filter: { user_email: user.email, genre: payload.genre },
    limit: 1,
  }))[0];
  if (current) await records('GenreTally').update(current.id, { count: Number(current.count || 0) + 1 });
  else await records('GenreTally').create({ user_email: user.email, genre: payload.genre, count: 1 }, user);
  return { ok: true };
}

export async function trackVisit(context, payload) {
  const timezone = String(payload.timezone || 'UTC');
  let date;
  try {
    date = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  } catch {
    date = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date());
  }
  const ip = context.request.ip || '';
  const key = context.user?.id
    ? `u:${context.user.id}`
    : `g:${createHash('sha256').update(`visit:${ip}`).digest('hex').slice(0, 8)}`;
  const stat = (await records('DailyStat').list({ filter: { date }, limit: 1 }))[0];
  const visitorKeys = stat?.visitor_keys || [];
  if (visitorKeys.includes(key)) return { ok: true, counted: false, date };
  if (stat) {
    await records('DailyStat').update(stat.id, {
      visitors: Number(stat.visitors || 0) + 1,
      visitor_keys: [...visitorKeys, key].slice(-5000),
    });
  } else {
    await records('DailyStat').create({ date, visitors: 1, visitor_keys: [key] });
  }
  return { ok: true, counted: true, date };
}

export async function adminOnly(context) {
  requireAdmin(context);
  return { ok: true };
}
