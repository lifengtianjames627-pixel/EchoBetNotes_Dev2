import { base44 } from '@/api/base44Client';
import { displayName } from '@/lib/displayName';
import { publicName } from '@/shared/identity';

const moderationFields = mod => ({
  moderation_status: mod.suggestedAction === 'review' ? 'pending_review' : 'approved',
  moderation_categories: mod.categories,
  moderation_reason: mod.reason,
  moderation_confidence: mod.confidence,
});

export async function publishAlbumReview({ data, album, user, moderate }) {
  const mod = await moderate(`${data.title}\n${data.content}`);
  const review = await base44.entities.Review.create({
    ...data,
    album_id: album.id,
    album_title: album.title,
    album_artist: album.artist,
    album_cover_url: album.cover_url || '',
    reviewer_name: displayName(user) || 'Anonymous',
    reviewer_email: user.email,
    ...moderationFields(mod),
    likes_count: 0,
  });
  await base44.functions.invoke('editReview', { action: 'syncRating', album_id: album.id });
  return review;
}

export async function publishStoryReview({ draft, user, moderate }) {
  const { kind, title, content, genre, heroImage, albums } = draft;
  const mod = await moderate(`${title}\n${content}\n${albums.map(a => a.blurb).join('\n')}`);
  const payload = {
    kind, title: title.trim(), content: content.trim(),
    genre: genre || undefined, hero_image_url: heroImage.trim() || undefined,
    reviewer_name: publicName(user), reviewer_email: user?.email || '',
    ...moderationFields(mod),
  };
  if (kind === 'genre_roundup') {
    payload.featured_albums = albums.filter(a => a.title.trim()).map(a => ({
      title: a.title.trim(), artist: a.artist.trim(), cover_url: a.cover_url.trim(), blurb: a.blurb.trim(),
    }));
  }
  return base44.entities.Review.create(payload);
}

export async function saveReviewEdit(review, draft) {
  return (await base44.functions.invoke('editReview', {
    id: review.id, changes: draft, expected_edit: review.edited_at || null,
  })).data;
}