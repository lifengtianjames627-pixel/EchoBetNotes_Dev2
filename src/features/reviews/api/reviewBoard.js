import { base44 } from '@/api/base44Client';
import { withCurrentAlbums } from '@/shared/reviews/catalog';

// This is the existing latest-60 window, not a full or paginated catalog.
export const PUBLIC_REVIEW_LIMIT = 60;

export async function fetchPublicReviews(limit = PUBLIC_REVIEW_LIMIT) {
  return withCurrentAlbums(await base44.entities.Review.list('-created_date', limit));
}

export async function fetchReviewsBoard() {
  const response = await base44.functions.invoke('reviewsBoard', {});
  return response.data;
}