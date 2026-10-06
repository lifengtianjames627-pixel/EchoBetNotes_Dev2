// Discovery no longer collects or matches age brackets. Moderation remains authoritative.
export function publicRecruitment(post) {
  return post.status === 'active' && [undefined, null, '', 'approved'].includes(post.moderation_status);
}
export function publicRecruitmentQuery() {
  return { status: 'active', moderation_status: { $in: ['approved', '', null] } };
}