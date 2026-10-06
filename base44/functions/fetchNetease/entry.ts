import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// NetEase Cloud Music (网易云音乐) has by far the best ACG/anime soundtrack
// catalog, but no official public API — its endpoints require the same
// "weapi" request encryption its own web player uses. This reimplements that
// encryption (AES-128-CBC double pass + RSA-style modexp) with no external
// deps, since it's unofficial and may break if NetEase changes it.

const IV = '0102030405060708';
const PRESET_KEY = '0CoJUm6Qyw8W8jud';
const PUB_KEY = '010001';
const MODULUS = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';

const HEADERS = {
  'Referer': 'https://music.163.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Cookie': 'os=pc',
};

async function aesEncrypt(text, keyStr) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(keyStr), { name: 'AES-CBC' }, false, ['encrypt']);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: enc.encode(IV) }, cryptoKey, enc.encode(text));
  let binary = '';
  new Uint8Array(cipher).forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function modPow(base, exp, mod) {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

function rsaEncrypt(text) {
  const reversed = text.split('').reverse().join('');
  const hex = Array.from(new TextEncoder().encode(reversed)).map(b => b.toString(16).padStart(2, '0')).join('');
  const result = modPow(BigInt('0x' + hex), BigInt('0x' + PUB_KEY), BigInt('0x' + MODULUS));
  return result.toString(16).padStart(256, '0');
}

function randomKey(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function weapiParams(obj) {
  const text = JSON.stringify(obj);
  const secretKey = randomKey(16);
  const params = await aesEncrypt(await aesEncrypt(text, PRESET_KEY), secretKey);
  const encSecKey = rsaEncrypt(secretKey);
  return new URLSearchParams({ params, encSecKey });
}

async function weapiPost(url, obj) {
  const body = await weapiParams(obj);
  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: body.toString() });
  if (!res.ok) return null;
  return res.json();
}

function normalize(str) {
  return (str || '').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '');
}

function bigramSet(str) {
  const s = normalize(str);
  if (s.length < 2) return new Set([s]);
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function similarity(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const setA = bigramSet(na), setB = bigramSet(nb);
  let overlap = 0;
  setA.forEach(g => { if (setB.has(g)) overlap++; });
  return (2 * overlap) / (setA.size + setB.size);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, artist } = await req.json();
    if (!title) return Response.json({ error: 'Missing title' }, { status: 400 });

    let searchData = await weapiPost('https://music.163.com/weapi/search/get', {
      s: title,
      type: 10,
      limit: 8,
      offset: 0,
    });
    if (!searchData?.result?.albums?.length) {
      searchData = await weapiPost('https://music.163.com/weapi/search/get', {
        s: `${artist || ''} ${title}`.trim(),
        type: 10,
        limit: 8,
        offset: 0,
      });
    }
    const albums = searchData?.result?.albums || [];
    if (!albums.length) return Response.json({ tracks: [], coverUrl: null });

    let best = null, bestScore = -1;
    for (const a of albums) {
      const score = similarity(a.name, title) * 0.65 + similarity(a.artist?.name || '', artist || '') * 0.35;
      if (score > bestScore) { bestScore = score; best = a; }
    }
    if (!best || bestScore < 0.4) return Response.json({ tracks: [], coverUrl: null });

    const albumData = await weapiPost(`https://music.163.com/weapi/v1/album/${best.id}`, {});
    const tracks = (albumData?.songs || []).map(s => s.name).filter(Boolean);
    const coverUrl = albumData?.album?.picUrl || best.picUrl || null;

    return tracks.length
      ? Response.json({ tracks, coverUrl, source: 'NetEase' })
      : Response.json({ tracks: [], coverUrl: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});