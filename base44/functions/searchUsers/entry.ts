import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { safeMemberName } from '../../shared/memberAccess.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { query } = await req.json();
    if (typeof query !== 'string' || query.trim().length < 2 || query.length > 100 || query.includes('@')) return Response.json({ results: [] });
    const q = query.trim().toLowerCase();
    const results = [];
    let skip = 0;
    let page;
    do {
      // User supports the legacy app-user listing, not the entity cursor endpoint.
      page = await base44.asServiceRole.entities.User.list('-created_date', 100, skip);
      for (const member of page) {
        const name = safeMemberName(member);
        if (member.id !== user.id && name.toLowerCase().includes(q)) results.push({ id: member.id, full_name: name });
        if (results.length === 10) break;
      }
      skip += page.length;
    } while (page.length === 100 && results.length < 10);
    return Response.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}