import { describe, expect, it } from 'vitest';
import { assertCollectionRead, assertEntityOperation, canReadRecord, prepareEntityInput } from '../entities/policies.js';

const member = { id: '111111111111111111111111', email: 'member@example.com', role: 'user' };
const admin = { id: '222222222222222222222222', email: 'admin@example.com', role: 'admin' };

describe('entity authorization policies', () => {
  it('keeps approved reviews public and pending reviews private', () => {
    expect(canReadRecord('Review', null, { moderation_status: 'approved' })).toBe(true);
    expect(canReadRecord('Review', null, { moderation_status: 'pending_review' })).toBe(false);
    expect(canReadRecord('Review', member, {
      moderation_status: 'pending_review',
      created_by_id: member.id,
    })).toBe(true);
  });

  it('prevents direct workflow-only writes', () => {
    expect(() => assertEntityOperation('ChatMessage', 'create', member, null, {}))
      .toThrowError(/dedicated workflow/i);
  });

  it('limits chat reads to participants even for administrators', () => {
    const record = { participants: ['member@example.com', 'peer@example.com'] };
    expect(canReadRecord('ChatMessage', member, record)).toBe(true);
    expect(canReadRecord('ChatMessage', admin, record)).toBe(false);
  });

  it('binds owner fields to the authenticated actor', () => {
    expect(prepareEntityInput('PinnedPeer', member, { owner_email: 'other@example.com' }).owner_email)
      .toBe(member.email);
    expect(prepareEntityInput('Subscription', member, { subscriber_email: 'other@example.com' }).subscriber_email)
      .toBe(member.email);
    expect(prepareEntityInput('RecruitPost', member, {}).moderation_status)
      .toBe('pending_review');
    const review = prepareEntityInput('Review', member, {
      reviewer_email: 'other@example.com',
      reviewer_name: 'Someone else',
      likes_count: 40,
      moderation_status: 'approved',
    });
    expect(review.reviewer_email).toBe(member.email);
    expect(review.reviewer_name).toBe('Anonymous');
    expect(review.likes_count).toBe(0);
    expect(review.moderation_status).toBeUndefined();
    expect(() => prepareEntityInput('UserBadge', member, { badge_id: 'not-a-badge', user_email: member.email }))
      .toThrowError(/Unknown badge/);
  });

  it('asks anonymous callers to sign in before private collections', () => {
    expect(() => assertCollectionRead('ChatMessage', null)).toThrowError(/Authentication required/);
    expect(() => assertCollectionRead('Review', null)).not.toThrow();
    expect(() => assertCollectionRead('Notification', null)).toThrowError(/forbidden/);
  });

  it('requires workflow endpoints for friend requests and review votes', () => {
    expect(() => assertEntityOperation('FriendRequest', 'create', member, null, {}))
      .toThrowError(/workflow/i);
    expect(() => assertEntityOperation('ReviewVote', 'create', member, null, {}))
      .toThrowError(/workflow/i);
  });
});
