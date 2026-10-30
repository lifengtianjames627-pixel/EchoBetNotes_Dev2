import { beforeAll, describe, expect, it } from 'vitest';
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
        body: 'Still waiting for moderation.',
        moderation_status: 'pending_review',
        reviewer_email: author.user.email,
        reviewer_name: 'Author',
      },
    });
    expect(pending.statusCode).toBe(200);
    const pendingId = pending.json().id;

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
        body: 'Ready for everyone.',
        moderation_status: 'approved',
        reviewer_email: author.user.email,
        reviewer_name: 'Author',
      },
    });
    expect(approved.statusCode).toBe(200);
    const reviewId = approved.json().id;

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
