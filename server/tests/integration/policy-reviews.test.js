import { beforeAll, describe, expect, it } from 'vitest';
import { entity } from '../../entities/repository.js';
import { bearer, invokeFunction, registerMember } from './helpers.js';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
});

describe('review and vote policies', () => {
  it('hides pending reviews from other members and keeps votes workflow-scoped', async () => {
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
    expect(pending.statusCode).toBe(200);
    expect(pending.json().reviewer_email).toBe(author.user.email);
    expect(pending.json().likes_count).toBe(0);
    expect(pending.json().reviewer_equipped_badges).toEqual([]);
    expect(pending.json().moderation_status).toBe('approved');
    const pendingId = pending.json().id;

    const moderator = await registerMember(app, 'moderator');
    await entity('User').update(moderator.user.id, { role: 'admin' });
    const hidden = await invokeFunction(app, moderator.token, 'editReview', {
      action: 'moderate',
      id: pendingId,
      status: 'blocked',
    });
    expect(hidden.statusCode).toBe(200);

    const readerPendingList = await app.inject({
      method: 'POST',
      url: '/api/entities/Review/filter',
      headers: bearer(reader.token),
      payload: { filter: { id: pendingId }, limit: 5 },
    });
    expect(readerPendingList.json()).toHaveLength(0);

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
    expect(approved.statusCode).toBe(200);
    expect(approved.json().reviewer_email).toBe(author.user.email);
    const reviewId = approved.json().id;

    const directEdit = await app.inject({
      method: 'PATCH',
      url: `/api/entities/Review/${reviewId}`,
      headers: bearer(author.token),
      payload: { likes_count: 99, moderation_status: 'approved', content: 'Bypassed' },
    });
    expect(directEdit.statusCode).toBe(403);
    expect(directEdit.json().error).toBe('function_required');

    const guestAggregate = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/aggregate',
      payload: { groupBy: 'sender_email' },
    });
    expect(guestAggregate.statusCode).toBe(401);
    expect(guestAggregate.json().error).toBe('auth_required');

    const directVote = await app.inject({
      method: 'POST',
      url: '/api/entities/ReviewVote',
      headers: bearer(voter.token),
      payload: { review_id: reviewId, vote: 'like', voter_email: voter.user.email },
    });
    expect(directVote.statusCode).toBe(403);
    expect(directVote.json().error).toBe('function_required');

    const vote = await invokeFunction(app, voter.token, 'voteReview', {
      review_id: reviewId,
      vote: 'like',
    });
    expect(vote.statusCode).toBe(200);
    expect(vote.json().likes_count).toBeGreaterThanOrEqual(1);

    const outsiderVotes = await app.inject({
      method: 'POST',
      url: '/api/entities/ReviewVote/filter',
      headers: bearer(reader.token),
      payload: { filter: { review_id: reviewId }, limit: 10 },
    });
    expect(outsiderVotes.json()).toHaveLength(0);

    const voterVotes = await app.inject({
      method: 'POST',
      url: '/api/entities/ReviewVote/filter',
      headers: bearer(voter.token),
      payload: { filter: { review_id: reviewId }, limit: 10 },
    });
    expect(voterVotes.json()).toHaveLength(1);

    const patchAttempt = await app.inject({
      method: 'PATCH',
      url: `/api/entities/Review/${reviewId}`,
      headers: bearer(reader.token),
      payload: { title: 'Hijacked' },
    });
    expect(patchAttempt.statusCode).toBe(403);

    await app.close();
  });
});
