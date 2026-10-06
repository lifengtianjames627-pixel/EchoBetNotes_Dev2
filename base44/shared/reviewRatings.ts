export async function syncReviewRating(svc, albumId) {
  if (!albumId || typeof albumId !== 'string') return;
  const albums = await svc.entities.Album.filter({ id: albumId });
  if (!albums.length) return;
  let count = 0, total = 0, offset = 0;
  while (true) {
    const rows = await svc.entities.Review.filter({ album_id: albumId }, 'id', 100, offset);
    for (const r of rows) {
      if ((!r.moderation_status || r.moderation_status === 'approved') && Number.isFinite(r.rating) && r.rating > 0) {
        count++; total += r.rating;
      }
    }
    if (rows.length < 100) break;
    offset += rows.length;
  }
  await svc.entities.Album.update(albumId, { review_count: count, avg_rating: count ? Math.round(total / count * 10) / 10 : 0 });
}