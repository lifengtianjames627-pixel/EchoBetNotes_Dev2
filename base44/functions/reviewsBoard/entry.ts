import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const OID = /^[a-f\d]{24}$/i;
const approved = r => !r.moderation_status || r.moderation_status === 'approved';
const isAlbumReview = r => !r.kind || r.kind === 'album_review';

// Written-reviews board, three ordered sections:
//  - editorsPicks : reviews an admin has liked (admin curation, newest first)
//  - popularAlbums: albums ranked by views*0.3 + review likes*0.7
//  - recentReviews: newest reviews last
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const reviews = (await svc.entities.Review.list('-created_date', 200))
      .filter(r => approved(r) && isAlbumReview(r) && OID.test(r.album_id || ''));

    const ids = [...new Set(reviews.map(r => r.album_id))];
    const albums = [];
    for (let i = 0; i < ids.length; i += 100) {
      albums.push(...await svc.entities.Album.filter({ id: { $in: ids.slice(i, i + 100) } }, '-created_date', 100));
    }
    const byId = new Map(albums.map(a => [a.id, a]));

    const enrich = r => {
      const a = byId.get(r.album_id);
      return {
        id: r.id, album_id: r.album_id, rating: r.rating, title: r.title, content: r.content,
        reviewer_name: r.reviewer_name, reviewer_email: r.reviewer_email, likes_count: r.likes_count || 0,
        created_date: r.created_date, edited_at: r.edited_at,
        album_title: a.title, album_artist: a.artist, album_cover_url: a.cover_url || '', genre: a.genre || '',
      };
    };
    const live = reviews.filter(r => byId.has(r.album_id));

    // Admin likes drive the editors' picks.
    const admins = (await svc.entities.User.filter({ role: 'admin' }, '-created_date', 100)).map(u => u.email).filter(Boolean);
    const adminLikes = admins.length
      ? await svc.entities.ReviewVote.filter({ voter_email: { $in: admins }, vote: 'like' }, '-created_date', 500)
      : [];
    const likedIds = new Set(adminLikes.map(v => v.review_id));
    const editorsPicks = live.filter(r => likedIds.has(r.id)).map(enrich);

    // Album popularity — views weigh 0.3, review likes weigh 0.7.
    const likesByAlbum = {};
    live.forEach(r => { likesByAlbum[r.album_id] = (likesByAlbum[r.album_id] || 0) + (r.likes_count || 0); });
    const popularAlbums = [...byId.values()]
      .map(a => {
        const views = a.click_count || 0;
        const likes = likesByAlbum[a.id] || 0;
        return {
          id: a.id, title: a.title, artist: a.artist, cover_url: a.cover_url || '', genre: a.genre || '',
          avg_rating: a.avg_rating || 0, review_count: a.review_count || 0,
          views, likes, score: Number((views * 0.3 + likes * 0.7).toFixed(2)),
        };
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 9);

    return Response.json({
      editorsPicks,
      popularAlbums,
      recentReviews: live.slice(0, 9).map(enrich),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}