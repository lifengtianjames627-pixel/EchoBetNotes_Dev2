import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { findMember, safeMemberName } from '../../shared/memberAccess.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const body = await req.json();
    const svc = base44.asServiceRole;
    if (body.action === 'send') {
      if ((body.message !== undefined && typeof body.message !== 'string') || (body.message || '').length > 1000) {
        return Response.json({ error: 'invalid_message' }, { status: 400 });
      }
      const target = await findMember(base44, { user_id: body.target_id, email: body.target_email });
      if (!target?.email) return Response.json({ error: 'member_unavailable' }, { status: 404 });
      if (target.id === user.id || target.email === user.email) return Response.json({ error: 'self_request' }, { status: 400 });
      const pair = { $or: [{ from_email: user.email, to_email: target.email }, { from_email: target.email, to_email: user.email }] };
      // Accepted takes precedence over historical pending duplicates, in either direction.
      for (const status of ['accepted', 'pending']) {
        const existing = await svc.entities.FriendRequest.filter({ $and: [pair, { status }] }, '-created_date', 1);
        if (existing.length) return Response.json({ request: existing[0], created: false });
      }
      const record = await svc.entities.FriendRequest.create({
        from_email: user.email, from_name: safeMemberName(user),
        to_email: target.email, to_name: safeMemberName(target),
        message: (body.message || '').trim(), status: 'pending',
      });
      // Preserve the profile action's existing in-app notification, never a caller-chosen recipient.
      if (body.notify === true) {
        try {
          await svc.entities.Notification.create({ owner_email: target.email, type: 'friend_request',
            title: `${safeMemberName(user)} sent you a friend request`, link: '/profile', actor_name: safeMemberName(user) });
        } catch { console.warn('Friend request saved; in-app notification failed'); }
      }
      return Response.json({ request: record, created: true });
    }
    if (body.action === 'respond') {
      if (typeof body.id !== 'string' || !/^[a-f0-9]{24}$/i.test(body.id) || !['accepted', 'declined'].includes(body.status)) {
        return Response.json({ error: 'invalid_response' }, { status: 400 });
      }
      const record = (await svc.entities.FriendRequest.filter({ id: body.id }, '-created_date', 1))[0];
      if (!record || record.to_email !== user.email || record.from_email === user.email) {
        return Response.json({ error: 'forbidden' }, { status: 403 });
      }
      if (record.status !== 'pending' && record.status !== body.status) return Response.json({ error: 'already_resolved' }, { status: 409 });
      // Conditional write: only the recipient's still-pending request may transition.
      if (record.status === 'pending') await svc.entities.FriendRequest.updateMany(
        { id: record.id, to_email: user.email, status: 'pending' }, { $set: { status: body.status } });
      const saved = (await svc.entities.FriendRequest.filter({ id: record.id }, '-created_date', 1))[0];
      if (saved?.status !== body.status) return Response.json({ error: 'already_resolved' }, { status: 409 });
      return Response.json({ request: saved });
    }
    return Response.json({ error: 'invalid_action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: 'request_failed' }, { status: error.status === 401 ? 401 : 500 });
  }
}