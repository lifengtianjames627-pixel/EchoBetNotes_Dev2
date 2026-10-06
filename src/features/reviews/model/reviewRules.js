// Public visibility and legacy kind handling shared by review discovery.
export const isAlbumReview = review => !review.kind || review.kind === 'album_review';
export const isApproved = review => !review.moderation_status || review.moderation_status === 'approved';

// Presentation rule only; server permissions remain the authority.
export function visibleAlbumReviews(reviews, currentUser) {
  return reviews.filter(review => isApproved(review) || review.created_by_id === currentUser?.id);
}

export function groupPublicReviews(reviews) {
  const approved = reviews.filter(isApproved);
  return {
    albumReviews: approved.filter(isAlbumReview),
    stories: approved.filter(review => review.kind === 'journey_story'),
    roundups: approved.filter(review => review.kind === 'genre_roundup'),
  };
}