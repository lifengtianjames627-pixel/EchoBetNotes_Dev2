import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// System notifications (likes, follows, badges, friend requests…). All access
// is mediated through this function: it identifies the caller via auth.me() and
// uses the service role to read/write Notification records scoped to that user's
// email, so the entity itself is locked to admins and never queried directly.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      const items = await base44.asServiceRole.entities.Notification.list('-created_date', 30);
      const mine = (items || []).filter(n => n.owner_email === user.email);
      const unread = mine.filter(n => !n.read).length;
      return Response.json({ items: mine, unread });
    }

    if (action === 'create') {
      const { owner_email, type, title, body: text, link, actor_name } = body;
      if (!owner_email || !type || !title) return Response.json({ error: 'Missing fields' }, { status: 400 });
      if (owner_email === user.email) return Response.json({ skipped: true }); // never notify yourself
      const created = await base44.asServiceRole.entities.Notification.create({
        owner_email,
        type,
        title,
        body: text || '',
        link: link || '',
        actor_name: actor_name || '',
        read: false,
      });
      return Response.json({ ok: true, id: created.id });
    }

    if (action === 'markAll') {
      const items = await base44.asServiceRole.entities.Notification.list('-created_date', 100);
      const mine = (items || []).filter(n => n.owner_email === user.email && !n.read);
      if (mine.length > 0) {
        await base44.asServiceRole.entities.Notification.bulkUpdate(mine.map(n => ({ id: n.id, read: true })));
      }
      return Response.json({ ok: true });
    }

    if (action === 'markRead') {
      const { id } = body;
      if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
      await base44.asServiceRole.entities.Notification.update(id, { read: true });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}