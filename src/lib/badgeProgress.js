// Which of the review-driven badges a member has earned. Attendance badges are
// awarded from browsing time in Layout; these come from their written work.
export function earnedFromReviews({ reviews = [], albums = [] }) {
  const ids = [];
  const n = reviews.length;
  if (n >= 5) ids.push('reviews_5');
  if (n >= 25) ids.push('reviews_25');
  if (n >= 100) ids.push('reviews_100');

  const byId = Object.fromEntries(albums.map(a => [a.id, a]));
  const mine = reviews.map(r => byId[r.album_id]).filter(Boolean);

  const genres = new Set(mine.map(a => a.genre).filter(Boolean));
  if (genres.size >= 3) ids.push('genres_3');
  if (genres.size >= 6) ids.push('genres_6');
  if (genres.size >= 10) ids.push('genres_10');

  const views = mine.reduce((sum, a) => sum + (a.click_count || 0), 0);
  if (views >= 100) ids.push('views_100');
  if (views >= 1000) ids.push('views_1000');
  if (views >= 5000) ids.push('views_5000');

  const likes = reviews.reduce((sum, r) => sum + (r.likes_count || 0), 0);
  if (likes >= 100) ids.push('likes_100');
  if (likes >= 300) ids.push('likes_300');
  if (likes >= 500) ids.push('likes_500');

  return ids;
}