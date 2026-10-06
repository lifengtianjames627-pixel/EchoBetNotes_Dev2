import { base44 } from '@/api/base44Client';
import { awardBadge } from '@/lib/badgeUtils';
import { notify } from '@/lib/notify';
import { displayName } from '@/lib/displayName';

export async function notifyReviewLike(review, user, client) {
  if (!review.reviewer_email) return;
  let totalLikes = 0, offset = 0;
  while (true) {
    const reviews = await base44.entities.Review.filter({ reviewer_email: review.reviewer_email }, 'id', 100, offset);
    totalLikes += reviews.reduce((sum, item) => sum + (item.likes_count || 0), 0);
    if (reviews.length < 100) break;
    offset += reviews.length;
  }
  for (const threshold of [100, 300, 500]) {
    if (totalLikes >= threshold) awardBadge(review.reviewer_email, `likes_${threshold}`, client);
  }
  notify({
    owner_email: review.reviewer_email, type: 'like',
    title: `${displayName(user)} liked your review`,
    body: review.album_title ? `On "${review.album_title}"` : '',
    link: review.album_id ? `/album/${review.album_id}` : '/reviews',
    actor_name: displayName(user),
  });
}