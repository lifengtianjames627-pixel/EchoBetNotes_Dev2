import { apiClient } from '@/api/appClient';

// Preserve the existing detail lookup and latest-50 review window.
export const ALBUM_REVIEW_LIMIT = 50;

export async function fetchReviewAlbum(id) {
  const albums = await apiClient.entities.Album.filter({ id });
  return albums[0];
}

export function fetchAlbumReviews(id) {
  return apiClient.entities.Review.filter({ album_id: id }, '-created_date', ALBUM_REVIEW_LIMIT);
}

export async function fetchReviewRecord(id) {
  return (await apiClient.entities.Review.filter({ id }))[0] || null;
}