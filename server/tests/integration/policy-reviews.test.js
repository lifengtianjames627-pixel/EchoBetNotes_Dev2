import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { buildApp } from '../../app.js';
import { entity } from '../../entities/repository.js';
import { bearer, invokeFunction, registerMember } from './helpers.js';
import { createTestDatabase } from './setup.js';

let testDb;

before(async () => {
  testDb = await createTestDatabase();
});

after(async () => {
  await testDb.close();
});

describe('review and vote policies', () => {
  it('hides blocked reviews from other members and keeps votes workflow-scoped', async () => {
    const app = await buildApp({ logger: false });
    const author = await registerMember(app, 'author');
    const reader = await registerMember(app, 'reader');
    const voter = await registerMember(app, 'voter');

    const pending = await app.inject({
      method: 'POST',
      url: '/api/entities/Review',
      headers: bearer(author.token),
      payload: {
        title: 'Pending thoughts',
        content: 'Still waiting for moderation.',
        moderation_status: 'pending_review',
        reviewer_email: 'other@example.com',
        reviewer_name: 'Someone else',
        likes_count: 40,
        reviewer_equipped_badges: ['not-a-badge'],
      },
    });
    assert.equal(pending.statusCode, 200);
    assert.equal(pending.json().reviewer_email, author.user.email);
    assert.equal(pending.json().likes_count, 0);
    assert.deepEqual(pending.json().reviewer_equipped_badges, []);
    assert.equal(pending.json().moderation_status, 'approved');
    const pendingId = pending.json().id;

    const moderator = await registerMember(app, 'moderator');
    await entity('User').update(moderator.user.id, { role: 'admin' });
    const hidden = await invokeFunction(app, moderator.token, 'editReview', {
      action: 'moderate',
      id: pendingId,
      status: 'blocked',
    });
    assert.equal(hidden.statusCode, 200);

    const readerPendingList = await app.inject({
      method: 'POST',
      url: '/api/entities/Review/filter',
      headers: bearer(reader.token),
      payload: { filter: { id: pendingId }, limit: 5 },
    });
    assert.equal(readerPendingList.json().length, 0);

    const approved = await app.inject({
      method: 'POST',
      url: '/api/entities/Review',
      headers: bearer(author.token),
      payload: {
        title: 'Approved thoughts',
        content: 'Ready for everyone.',
        moderation_status: 'approved',
        reviewer_email: 'other@example.com',
        reviewer_name: 'Author',
      },
    });
    assert.equal(approved.statusCode, 200);
    assert.equal(approved.json().reviewer_email, author.user.email);
    const reviewId = approved.json().id;

    const directEdit = await app.inject({
      method: 'PATCH',
      url: `/api/entities/Review/${reviewId}`,
      headers: bearer(author.token),
      payload: { likes_count: 99, moderation_status: 'approved', content: 'Bypassed' },
    });
    assert.equal(directEdit.statusCode, 403);
    assert.equal(directEdit.json().error, 'function_required');

    const guestAggregate = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/aggregate',
      payload: { groupBy: 'sender_email' },
    });
    assert.equal(guestAggregate.statusCode, 401);
    assert.equal(guestAggregate.json().error, 'auth_required');

    const directVote = await app.inject({
      method: 'POST',
      url: '/api/entities/ReviewVote',
      headers: bearer(voter.token),
      payload: { review_id: reviewId, vote: 'like', voter_email: voter.user.email },
    });
    assert.equal(directVote.statusCode, 403);
    assert.equal(directVote.json().error, 'function_required');

    const vote = await invokeFunction(app, voter.token, 'voteReview', {
      review_id: reviewId,
      vote: 'like',
    });
    assert.equal(vote.statusCode, 200);
    assert.ok(vote.json().likes_count >= 1);

    const outsiderVotes = await app.inject({
      method: 'POST',
      url: '/api/entities/ReviewVote/filter',
      headers: bearer(reader.token),
      payload: { filter: { review_id: reviewId }, limit: 10 },
    });
    assert.equal(outsiderVotes.json().length, 0);

    const voterVotes = await app.inject({
      method: 'POST',
      url: '/api/entities/ReviewVote/filter',
      headers: bearer(voter.token),
      payload: { filter: { review_id: reviewId }, limit: 10 },
    });
    assert.equal(voterVotes.json().length, 1);

    const patchAttempt = await app.inject({
      method: 'PATCH',
      url: `/api/entities/Review/${reviewId}`,
      headers: bearer(reader.token),
      payload: { title: 'Hijacked' },
    });
    assert.equal(patchAttempt.statusCode, 403);

    await app.close();
  });
});
