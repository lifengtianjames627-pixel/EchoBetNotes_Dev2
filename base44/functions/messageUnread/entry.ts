import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Unread direct-message count for the Messages nav badge — the SUM of every
// conversation's unread. "Unread" for a peer = messages from that peer arriving
// after the per-peer messages_last_seen[peer] timestamp. Opening that specific
// conversation resets just that peer's count. A legacy single ISO string (old
// global timestamp) is honoured so existing users don't see every old message
// as unread.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const seenRaw = user.messages_last_seen;
    const seenMap = (typeof seenRaw === 'object' && seenRaw && !Array.isArray(seenRaw)) ? seenRaw : {};
    const legacyGlobal = (typeof seenRaw === 'string' && seenRaw) ? new Date(seenRaw) : null;
    const lastSeenFor = (peer) => seenMap[peer] ? new Date(seenMap[peer]) : (legacyGlobal || new Date(0));

    const messages = await base44.asServiceRole.entities.ChatMessage.list('-created_date', 200);
    const myEmail = user.email;
    const unread = (messages || []).filter(m => {
      if (m.sender_email === myEmail) return false;
      const parts = (m.chat_id || '').split('|');
      if (!parts.includes(myEmail)) return false;
      const peer = parts.find(e => e !== myEmail);
      return new Date(m.created_date) > lastSeenFor(peer);
    }).length;

    return Response.json({ unread });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}