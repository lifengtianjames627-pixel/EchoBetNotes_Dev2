import { HttpError } from './policies.js';
import { entity } from './repository.js';
import { BADGE_IDS } from '../shared/badgeIds.js';
import { safeMemberName } from '../shared/identity.js';
import { moderateText } from '../shared/llm.js';

const textOf = (input) => [input.title, input.content, input.body, input.band_style, input.band_background, input.band_history, input.band_story]
  .filter(Boolean)
  .join('\n');

export async function applyCreateModeration(entityName, input) {
  if (entityName !== 'Review' && entityName !== 'Comment') return input;
  const moderation = await moderateText(textOf(input));
  if (moderation.suggestedAction === 'block') {
    throw new HttpError(422, 'content_blocked', moderation.reason || 'Content blocked');
  }
  const next = {
    ...input,
    moderation_status: moderation.suggestedAction === 'review' ? 'pending_review' : 'approved',
    moderation_reason: moderation.reason || '',
    moderation_categories: moderation.categories || [],
    moderation_confidence: moderation.confidence || 0,
  };
  if (entityName === 'Review') {
    const earned = await earnedBadgeIds(input.reviewer_email);
    const requested = Array.isArray(input.reviewer_equipped_badges) ? input.reviewer_equipped_badges : [];
    next.reviewer_equipped_badges = requested.filter((id) => BADGE_IDS.has(id) && earned.has(id)).slice(0, 4);
  }
  return next;
}

const earnedBadgeIds = async (email) => {
  const rows = await entity('UserBadge').list({ filter: { user_email: email }, limit: 100 });
  return new Set(rows.map((row) => row.badge_id));
};

export async function sanitizeEntityChanges(entityName, record, changes) {
  const next = { ...changes };
  for (const field of ['id', 'created_by', 'created_by_id', 'created_date', 'updated_date']) delete next[field];
  if (entityName === 'Album') {
    delete next.avg_rating;
    delete next.review_count;
  }
  if (entityName === 'User') {
    for (const field of ['role', 'email', 'password', 'password_hash']) delete next[field];
    if ('equipped_badges' in next) {
      const requested = Array.isArray(next.equipped_badges) ? next.equipped_badges.map(String).slice(0, 4) : [];
      const earned = await earnedBadgeIds(record?.email);
      next.equipped_badges = requested.filter((id) => BADGE_IDS.has(id) && earned.has(id));
    }
  }
  if (entityName === 'Comment' && changes) {
    // Administrators are the only role allowed to update comments, and they
    // use that path to approve or block. Identity fields stay put.
    delete next.author_email;
    delete next.author_name;
  }
  return next;
}
