export const isVisibleReview = (review, actor) =>
  !review.moderation_status
  || review.moderation_status === 'approved'
  || review.created_by_id === actor?.id
  || actor?.role === 'admin';

export function reviewVoteTotals(votes) {
  const latest = new Map();
  for (const vote of [...votes].sort((a, b) =>
    new Date(a.updated_date || a.created_date) - new Date(b.updated_date || b.created_date))) {
    latest.set(String(vote.voter_email || '').toLowerCase(), vote);
  }
  return [...latest.values()].reduce((totals, vote) => {
    if (vote.vote === 'like') totals.likes_count += 1;
    if (vote.vote === 'dislike') totals.dislikes_count += 1;
    return totals;
  }, { likes_count: 0, dislikes_count: 0 });
}

export function albumRating(reviews) {
  const ratings = reviews
    .filter((review) => (!review.moderation_status || review.moderation_status === 'approved'))
    .map((review) => Number(review.rating))
    .filter((rating) => Number.isFinite(rating) && rating > 0);
  return {
    review_count: ratings.length,
    avg_rating: ratings.length
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : 0,
  };
}
