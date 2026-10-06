import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { safeMemberName } from '../../shared/memberAccess.ts';

// Live profile resolver for review/post authors. Content stores the author's
// email (reviewer_email, author_email, …) as the durable binding key; the
// author's name + avatar are resolved live from their User record here so a
// rename or avatar change is reflected everywhere immediately, including on
// content written before the change. This is the "binding" that the snapshot
// fields (reviewer_name, …) cannot guarantee retroactively.
//
// Input:  { emails: string[] }
// Output: { results: { [email]: { name, picture_url } } }
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const emails = Array.isArray(body?.emails) ? body.emails : [];
    if (!emails.length) return Response.json({ results: {} });

    const unique = [...new Set(emails.filter(Boolean))];
    const matches = await base44.asServiceRole.entities.User.filter({ email: { $in: unique } }, undefined, 100);
    const results = {};
    for (const u of matches) {
      results[u.email] = {
        name: safeMemberName(u),
        picture_url: u.profile_picture_url || '',
      };
    }
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}