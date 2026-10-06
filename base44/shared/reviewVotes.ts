export async function readReviewVotes(svc, reviewId) {
  const records = [];
  let offset = 0;
  while (true) {
    const page = await svc.entities.ReviewVote.filter({ review_id: reviewId }, 'id', 100, offset);
    records.push(...page);
    if (page.length < 100) return records;
    offset += page.length;
  }
}

export function latestReviewVotes(records) {
  const byVoter = new Map();
  const sorted = [...records].sort((a, b) =>
    String(a.updated_date || a.created_date || '').localeCompare(String(b.updated_date || b.created_date || '')) ||
    String(a.id).localeCompare(String(b.id)));
  for (const record of sorted) {
    const key = String(record.voter_email || '').toLowerCase();
    if (key && ['like', 'dislike'].includes(record.vote)) byVoter.set(key, record);
  }
  return [...byVoter.values()];
}

export function reviewVoteTotals(records) {
  const votes = latestReviewVotes(records);
  return {
    likes_count: votes.filter(record => record.vote === 'like').length,
    dislikes_count: votes.filter(record => record.vote === 'dislike').length,
  };
}