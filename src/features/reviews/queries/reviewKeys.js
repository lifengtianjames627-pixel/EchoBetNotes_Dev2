// Keep legacy prefixes so existing saves and realtime invalidation still match.
export const reviewKeys = {
  publicList: (viewerId, limit) => ['public-reviews', { viewerId, limit }],
  board: viewerId => ['reviews-board', { viewerId }],
  album: id => ['album', id],
  albumReviews: id => ['album-reviews', id],
  record: id => ['review-record', id],
};