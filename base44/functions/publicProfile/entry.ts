import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { canViewMember, safeMemberName, findMember } from '../../shared/memberAccess.ts';

// Public-facing profile card for ANOTHER member. The User entity blocks
// non-admins from reading other people, so the few public fields are read with
// the service role and only those fields are returned — never the raw record.
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.user_id && !body.email) return Response.json({ error: 'Member identifier required' }, { status: 400 });
    const target = await findMember(base44, body);
    if (!canViewMember(user, target)) return Response.json({ found: false });

    const lastActive = target.last_active || null;
    return Response.json({
      found: true,
      id: target.id,
      // Legacy messaging uses this address internally, only after profile authorization.
      email: target.email,
      full_name: safeMemberName(target),
      profile_picture_url: target.profile_picture_url || '',
      equipped_badges: target.equipped_badges || [],
      last_active: lastActive,
      online: !!lastActive && (Date.now() - new Date(lastActive).getTime()) < ONLINE_WINDOW_MS,
      is_me: target.email === user.email,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}