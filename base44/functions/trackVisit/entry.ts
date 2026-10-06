import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { stableIdentityInput } from '../../shared/stableIdentityInput.ts';

// Counts one unique visitor per calendar day. Called once per app load from
// the site Layout. Logged-in visitors are deduped by their user id; guests by
// a one-way hash of their network address — so a single session reloading
// never inflates the count. The DailyStat record is admin-only; this runs as
// the service role to perform the controlled increment.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const now = new Date();
    let body = {};
    try { body = await req.json(); } catch { /* no body */ }
    const tz = body?.timezone || 'UTC';
    // Use the visitor's own calendar day (not UTC) so "today" matches what the
    // Stats page computes in the browser — otherwise a +08:00 evening visit lands
    // on yesterday's UTC bucket and never shows up as "today".
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);

    let user = null;
    try { user = await base44.auth.me(); } catch { /* public visitor */ }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
      || req.headers.get('cf-connecting-ip') || 'anon';

    let key;
    if (user && user.id) {
      key = 'u:' + user.id;
    } else {
      const data = stableIdentityInput('visit', ip);
      const buf = await crypto.subtle.digest('SHA-256', data);
      key = 'g:' + Array.from(new Uint8Array(buf)).slice(0, 8)
        .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const existing = await svc.entities.DailyStat.filter({ date: today });
    const rec = existing[0];

    if (!rec) {
      await svc.entities.DailyStat.create({
        date: today,
        visitors: 1,
        visitor_keys: [key],
      });
      return Response.json({ ok: true, counted: true, date: today });
    }

    const keys = rec.visitor_keys || [];
    if (keys.includes(key)) {
      return Response.json({ ok: true, counted: false, date: today });
    }

    await svc.entities.DailyStat.update(rec.id, {
      visitors: (rec.visitors || 0) + 1,
      // keep the dedup set bounded so a busy day can't grow it without limit
      visitor_keys: [...keys, key].slice(-5000),
    });

    return Response.json({ ok: true, counted: true, date: today });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}