import { base44 } from '@/api/base44Client';

import { isAlbumReview } from '@/features/reviews/model/reviewRules';
export { isAlbumReview, isApproved } from '@/features/reviews/model/reviewRules';
// Resolve only the referenced IDs, not the latest N albums. Missing parents
// are excluded from public discovery; written stories remain independent.
export async function withCurrentAlbums(reviews, { keepMissing = false } = {}) {
  const ids = [...new Set(reviews.filter(isAlbumReview).map(r => r.album_id).filter(id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)))];
  const albums = [];
  for (let i = 0; i < ids.length; i += 100) {
    albums.push(...await base44.entities.Album.filter({ id: { $in: ids.slice(i, i + 100) } }, '-created_date', 100));
  }
  const byId = new Map(albums.map(a => [a.id, a]));
  return reviews.flatMap(r => {
    if (!isAlbumReview(r)) return [r];
    const a = byId.get(r.album_id);
    if (!a) return keepMissing ? [{ ...r, album_missing: true }] : [];
    return [{ ...r, album_missing: false, album_title: a.title, album_artist: a.artist, album_cover_url: a.cover_url || '' }];
  });
}
// Preserve the shared entry point for existing callers during gradual migration.
export { isMusicQuery, refreshMusic } from '@/features/reviews/queries/musicCache';