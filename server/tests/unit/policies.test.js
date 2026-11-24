import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertCollectionRead, assertEntityOperation, canReadRecord, prepareEntityInput } from '../../entities/policies.js';

const member = { id: '111111111111111111111111', email: 'member@example.com', role: 'user' };
const admin = { id: '222222222222222222222222', email: 'admin@example.com', role: 'admin' };

describe('entity authorization policies', () => {
  it('keeps approved reviews public and pending reviews private', () => {
    assert.equal(canReadRecord('Review', null, { moderation_status: 'approved' }), true);
    assert.equal(canReadRecord('Review', null, { moderation_status: 'pending_review' }), false);
    assert.equal(canReadRecord('Review', member, {
      moderation_status: 'pending_review',
      created_by_id: member.id,
    }), true);
  });

  it('prevents direct workflow-only writes', () => {
    assert.throws(() => assertEntityOperation('ChatMessage', 'create', member, null, {}), /dedicated workflow/i);
  });

  it('limits chat reads to participants even for administrators', () => {
    const record = { participants: ['member@example.com', 'peer@example.com'] };
    assert.equal(canReadRecord('ChatMessage', member, record), true);
    assert.equal(canReadRecord('ChatMessage', admin, record), false);
  });

  it('binds owner fields to the authenticated actor', () => {
    assert.equal(prepareEntityInput('PinnedPeer', member, { owner_email: 'other@example.com' }).owner_email, member.email);
    assert.equal(prepareEntityInput('Subscription', member, { subscriber_email: 'other@example.com' }).subscriber_email, member.email);
    assert.equal(prepareEntityInput('RecruitPost', member, {}).moderation_status, 'pending_review');
    const review = prepareEntityInput('Review', member, {
      reviewer_email: 'other@example.com',
      reviewer_name: 'Someone else',
      likes_count: 40,
      moderation_status: 'approved',
    });
    assert.equal(review.reviewer_email, member.email);
    assert.equal(review.reviewer_name, 'Anonymous');
    assert.equal(review.likes_count, 0);
    assert.equal(review.moderation_status, undefined);
    assert.throws(() => prepareEntityInput('UserBadge', member, { badge_id: 'not-a-badge', user_email: member.email }), /Unknown badge/);
  });

  it('asks anonymous callers to sign in before private collections', () => {
    assert.throws(() => assertCollectionRead('ChatMessage', null), /Authentication required/);
    assert.doesNotThrow(() => assertCollectionRead('Review', null));
    assert.throws(() => assertCollectionRead('Notification', null), /forbidden/);
  });

  it('requires workflow endpoints for friend requests and review votes', () => {
    assert.throws(() => assertEntityOperation('FriendRequest', 'create', member, null, {}), /workflow/i);
    assert.throws(() => assertEntityOperation('ReviewVote', 'create', member, null, {}), /workflow/i);
  });
});
