import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Increments a listener's per-genre click tally. Called when they open an album
// or a genre space. Mediated through the service role so the GenreTally entity
// stays admin-locked; the caller is identified via auth.me().
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { genre } = await req.json().catch(() => ({}));
    if (!genre) return Response.json({ error: 'Missing genre' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.GenreTally.filter({ user_email: user.email, genre });
    if (existing.length > 0) {
      const rec = existing[0];
      await base44.asServiceRole.entities.GenreTally.update(rec.id, { count: (rec.count || 0) + 1 });
    } else {
      await base44.asServiceRole.entities.GenreTally.create({ user_email: user.email, genre, count: 1 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}