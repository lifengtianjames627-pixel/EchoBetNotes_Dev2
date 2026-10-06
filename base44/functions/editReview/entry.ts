import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { syncReviewRating } from '../../shared/reviewRatings.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, changes, expected_edit, action = 'edit', status, album_id } = await req.json();
    const svc = base44.asServiceRole;
    if (action === 'syncRating') {
      if (typeof album_id !== 'string' || !album_id) return Response.json({ error: 'Invalid album' }, { status: 400 });
      await syncReviewRating(svc, album_id);
      return Response.json({ ok: true });
    }
    if (typeof id !== 'string' || !id) return Response.json({ error: 'Invalid review' }, { status: 400 });
    const [review] = await base44.entities.Review.filter({ id });
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });
    let patch;
    if (action === 'moderate') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      if (!['approved', 'blocked'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
      patch = { moderation_status: status };
    } else {
      // ONLY the author can edit their review — strictly restricted to oneself, never anyone else (including non-author admins)
      const isOwner = Boolean(
        user && (
          (review.created_by_id && user.id && review.created_by_id === user.id) ||
          (review.reviewer_email && user.email && review.reviewer_email.toLowerCase() === user.email.toLowerCase())
        )
      );
      if (action !== 'edit' || !isOwner) {
        return Response.json({ error: 'Forbidden: only the author can modify this review' }, { status: 403 });
      }
      if ((expected_edit || null) !== (review.edited_at || null)) return Response.json({ error: 'conflict' }, { status: 409 });
      if (!changes || typeof changes.content !== 'string' || !changes.content.trim()) return Response.json({ error: 'Review text is required' }, { status: 400 });
      const albumReview = !review.kind || review.kind === 'album_review';
      const fields = ['title', 'content', ...(albumReview ? ['band_style', 'band_background', 'band_history', 'band_story'] : ['genre', 'hero_image_url'])];
      patch = {};
      for (const field of fields) {
        if (field in changes) {
          if (changes[field] != null && typeof changes[field] !== 'string') return Response.json({ error: 'Invalid text' }, { status: 400 });
          patch[field] = changes[field] ?? '';
        }
      }
      if (albumReview && 'rating' in changes) {
        if (!Number.isFinite(changes.rating) || changes.rating < 1 || changes.rating > 5) return Response.json({ error: 'Invalid rating' }, { status: 400 });
        patch.rating = changes.rating;
      }
      if (review.kind === 'genre_roundup' && 'featured_albums' in changes) {
        if (!Array.isArray(changes.featured_albums) || !changes.featured_albums.length || changes.featured_albums.some(a => !a || typeof a.title !== 'string' || !a.title.trim())) return Response.json({ error: 'Album titles are required' }, { status: 400 });
        patch.featured_albums = changes.featured_albums.map(a => Object.fromEntries(['title','artist','cover_url','blurb'].map(k => [k, typeof a[k] === 'string' ? a[k] : ''])));
      }
      if (Object.entries(patch).every(([k, value]) => JSON.stringify(value) === JSON.stringify(review[k] ?? ''))) return Response.json({ review });
      if (!albumReview && !(patch.title ?? review.title ?? '').trim()) return Response.json({ error: 'Title is required' }, { status: 400 });
      const merged = { ...review, ...patch };
      const result = await base44.functions.invoke('moderateContent', { text: [ ...fields.map(k => merged[k] || ''), ...(merged.featured_albums || []).map(a => `${a.title}\n${a.artist}\n${a.blurb}`) ].join('\n') });
      const mod = result.data;
      if (!mod || !['allow','review','block'].includes(mod.suggestedAction)) return Response.json({ error: 'Moderation unavailable' }, { status: 503 });
      if (mod.suggestedAction === 'block') return Response.json({ error: mod.reason || 'Content blocked' }, { status: 422 });
      const [fresh] = await base44.entities.Review.filter({ id });
      if (!fresh || (fresh.edited_at || null) !== (review.edited_at || null)) return Response.json({ error: 'conflict' }, { status: 409 });
      const timestamp = new Date().toISOString();
      Object.assign(patch, { edited_at: timestamp, edit_times: [...(review.edit_times || []), timestamp], moderation_status: mod.suggestedAction === 'review' ? 'pending_review' : 'approved', moderation_categories: mod.categories || [], moderation_reason: mod.reason || '', moderation_confidence: mod.confidence || 0 });
    }
    const saved = await svc.entities.Review.update(id, patch);
    await syncReviewRating(svc, review.album_id);
    return Response.json({ review: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}