export function canViewMember(viewer, target) {
  return !!viewer?.id && !!target;
}
export function safeMemberName(user) {
  const name = (user?.display_name || user?.full_name || '').trim();
  return name && !name.includes('@') ? name : 'Anonymous';
}
export async function findMember(base44, body) {
  if (body.user_id && (typeof body.user_id !== 'string' || !/^[a-f0-9]{24}$/i.test(body.user_id))) return null;
  const filter = typeof body.user_id === 'string' && body.user_id ? { id: body.user_id }
    : typeof body.email === 'string' && body.email ? { email: body.email } : null;
  if (!filter) return null;
  return (await base44.asServiceRole.entities.User.filter(filter, '-created_date', 1))[0] || null;
}