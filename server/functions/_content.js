import { HttpError } from '../entities/policies.js';
import { albumRating, isVisibleReview, reviewVoteTotals } from '../shared/reviews.js';
import { completeJson, moderateText } from '../shared/llm.js';
import { normalizeEmail } from '../shared/identity.js';
import { records, requireAdmin, requireUser } from './_helpers.js';

const withAlbum = async (reviews) => {
  const ids = [...new Set(reviews.map((review) => review.album_id).filter(Boolean))];
  const albums = ids.length
    ? await records('Album').list({ filter: { id: { $in: ids } }, limit: 1000 })
    : [];
  const byId = new Map(albums.map((album) => [album.id, album]));
  return reviews.map((review) => {
    const album = byId.get(review.album_id);
    return {
      ...review,
      album_title: album?.title || review.album_title,
      album_artist: album?.artist || review.album_artist,
      album_cover_url: album?.cover_url || review.album_cover_url,
      genre: album?.genre || review.genre,
    };
  });
};

export async function reviewsBoard() {
  const reviews = (await records('Review').list({ sort: '-created_date', limit: 200 }))
    .filter((review) => isVisibleReview(review, null) && (!review.kind || review.kind === 'album_review'));
  const hydrated = await withAlbum(reviews);
  const albums = await records('Album').list({ sort: '-created_date', limit: 500 });
  const scores = albums.map((album) => {
    const albumReviews = hydrated.filter((review) => review.album_id === album.id);
    const likes = albumReviews.reduce((sum, review) => sum + Number(review.likes_count || 0), 0);
    const views = Number(album.click_count || 0);
    return { ...album, views, likes, score: Math.round((views * 0.3 + likes * 0.7) * 100) / 100 };
  }).filter((album) => album.score > 0).sort((a, b) => b.score - a.score);
  const admins = await records('User').list({ filter: { role: 'admin' }, limit: 100 });
  const votes = admins.length
    ? await records('ReviewVote').list({
        filter: { voter_email: { $in: admins.map((user) => user.email) }, vote: 'like' },
        limit: 500,
      })
    : [];
  const picked = new Set(votes.map((vote) => vote.review_id));
  return {
    editorsPicks: hydrated.filter((review) => picked.has(review.id)).slice(0, 9),
    popularAlbums: scores.slice(0, 9),
    recentReviews: hydrated.slice(0, 9),
  };
}

export async function homeFeed(context) {
  const board = await reviewsBoard();
  const podcasts = await records('Podcast').list({ sort: '-created_date', limit: 4 });
  const user = context.user;
  const tallies = user
    ? await records('GenreTally').list({ filter: { user_email: user.email }, limit: 100 })
    : [];
  const preferences = new Set((user?.music_preferences || []).map((item) => String(item).toLowerCase()));
  const weighted = [...tallies].sort((a, b) => Number(b.count || 0) - Number(a.count || 0)).map((item) => item.genre);
  const genres = [...new Set([...preferences, ...weighted])];
  const forYou = genres.length
    ? board.recentReviews.filter((review) => genres.includes(String(review.genre || '').toLowerCase())).slice(0, 8)
    : [];
  return {
    recentReviews: board.recentReviews.slice(0, 6),
    recentPodcasts: podcasts,
    forYou,
    aiBlurb: '',
    tasteLabels: genres.join(', '),
    hasTaste: genres.length > 0,
    isLoggedIn: Boolean(user),
  };
}

async function syncRating(albumId) {
  if (!albumId) return;
  const reviews = await records('Review').list({ filter: { album_id: albumId }, limit: 1000 });
  const rating = albumRating(reviews);
  await records('Album').update(albumId, rating);
}

export async function moderateContent(context, payload) {
  requireUser(context);
  return moderateText(payload.text);
}

export async function editReview(context, payload) {
  const user = requireUser(context);
  const action = payload.action || 'edit';
  if (action === 'syncRating') {
    if (!payload.album_id) throw new HttpError(400, 'invalid_album');
    await syncRating(payload.album_id);
    return { ok: true };
  }
  const review = await records('Review').find(payload.id);
  if (!review) throw new HttpError(404, 'not_found');
  if (action === 'moderate') {
    requireAdmin(context);
    if (!['approved', 'blocked'].includes(payload.status)) throw new HttpError(400, 'invalid_status');
    return { review: await records('Review').update(review.id, { moderation_status: payload.status }) };
  }
  const author = review.created_by_id === user.id
    || normalizeEmail(review.reviewer_email) === normalizeEmail(user.email);
  if (!author) throw new HttpError(403, 'forbidden');
  if ((payload.expected_edit || null) !== (review.edited_at || null)) throw new HttpError(409, 'conflict');
  const changes = { ...(payload.changes || {}) };
  if (!String(changes.content || '').trim()) throw new HttpError(400, 'invalid_content');
  if (changes.rating !== undefined && (!Number.isFinite(Number(changes.rating)) || Number(changes.rating) < 1 || Number(changes.rating) > 5)) {
    throw new HttpError(400, 'invalid_rating');
  }
  const moderation = await moderateText([
    changes.title,
    changes.content,
    changes.band_style,
    changes.band_background,
    changes.band_history,
    changes.band_story,
  ].filter(Boolean).join('\n'));
  if (moderation.suggestedAction === 'block') throw new HttpError(422, 'content_blocked', moderation.reason);
  const now = new Date().toISOString();
  const updated = await records('Review').update(review.id, {
    ...changes,
    edited_at: now,
    edit_times: [...(review.edit_times || []), now],
    moderation_status: moderation.suggestedAction === 'review' ? 'pending_review' : 'approved',
    moderation_reason: moderation.reason || '',
  });
  await syncRating(updated.album_id);
  return { review: updated };
}

export async function voteReview(context, payload) {
  const user = requireUser(context);
  if (!['like', 'dislike', null].includes(payload.vote)) throw new HttpError(400, 'invalid_vote');
  const review = await records('Review').find(payload.review_id);
  if (!review) throw new HttpError(404, 'not_found');
  if (!isVisibleReview(review, user)) throw new HttpError(403, 'forbidden');
  const votes = await records('ReviewVote').list({ filter: { review_id: review.id }, sort: '-updated_date', limit: 1000 });
  const own = votes.filter((vote) => normalizeEmail(vote.voter_email) === normalizeEmail(user.email));
  const previous = own[0] || null;
  let voteId = null;
  if (payload.vote) {
    const saved = previous
      ? await records('ReviewVote').update(previous.id, { vote: payload.vote })
      : await records('ReviewVote').create({
          review_id: review.id,
          voter_email: user.email,
          vote: payload.vote,
        }, user);
    voteId = saved.id;
  } else if (previous) {
    await records('ReviewVote').remove(previous.id);
  }
  await Promise.all(own.slice(1).map((vote) => records('ReviewVote').remove(vote.id)));
  const fresh = await records('ReviewVote').list({ filter: { review_id: review.id }, limit: 1000 });
  const totals = reviewVoteTotals(fresh);
  await records('Review').update(review.id, totals);
  return { ...totals, vote: payload.vote, vote_id: voteId, previous_vote: previous?.vote || null };
}

export async function translateText(_context, payload) {
  const languages = { en: 'English', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', fr: 'French', ru: 'Russian' };
  if (!payload.text || !languages[payload.target]) throw new HttpError(400, 'invalid_translation');
  const result = await completeJson(
    'Translate music writing while preserving tone and proper nouns. Return JSON with translated.',
    `Target: ${languages[payload.target]}\n\n${String(payload.text).slice(0, 20_000)}`,
    { translated: String(payload.text) },
  );
  return { translated: result.translated || '' };
}

export async function resolveAcgTitle(context, payload) {
  requireUser(context);
  if (!payload.title) throw new HttpError(400, 'missing_title');
  const result = await completeJson(
    'Resolve an ACG music title to its official Japanese or international title and artist. Return JSON with title and artist.',
    JSON.stringify({ title: payload.title, artist: payload.artist || '' }),
    { title: payload.title, artist: payload.artist || '' },
  );
  return {
    title: result.title || result.resolved_title || payload.title,
    artist: result.artist || result.resolved_artist || payload.artist || '',
  };
}

export async function fetchNetease(context, payload) {
  requireUser(context);
  if (!payload.title) throw new HttpError(400, 'missing_title');
  const query = encodeURIComponent([payload.artist, payload.title].filter(Boolean).join(' '));
  try {
    const response = await fetch(`https://music.163.com/api/search/get/web?s=${query}&type=10&limit=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json();
    const album = data.result?.albums?.[0];
    if (!album) return { tracks: [], coverUrl: null };
    const detail = await fetch(`https://music.163.com/api/album/${album.id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10_000),
    }).then((item) => item.json());
    return {
      tracks: (detail.songs || []).map((song) => song.name).filter(Boolean),
      coverUrl: album.picUrl || null,
      source: 'NetEase',
    };
  } catch {
    return { tracks: [], coverUrl: null };
  }
}

export async function storeCoverImage(context, payload) {
  requireUser(context);
  if (!payload.imageUrl) throw new HttpError(400, 'missing_url');
  // Public URL ingestion is handled by the upload route; preserve graceful fallback.
  return { file_url: null };
}
