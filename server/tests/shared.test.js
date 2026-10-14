import { describe, expect, it } from 'vitest';
import { buildChatMessage, containsExternalContact, lastSeenFor } from '../shared/chatPolicy.js';
import { albumRating, reviewVoteTotals } from '../shared/reviews.js';

const actor = {
  id: '111111111111111111111111',
  email: 'listener@example.com',
  display_name: 'Listener',
};

describe('chat policy', () => {
  it('builds an actor-bound message', () => {
    const message = buildChatMessage(actor, {
      chat_id: 'listener@example.com|peer@example.com',
      content: 'What did you think of the record?',
    });
    expect(message.sender_email).toBe(actor.email);
    expect(message.participants).toEqual(['listener@example.com', 'peer@example.com']);
  });

  it('blocks off-platform contact information', () => {
    expect(containsExternalContact('message me at person@example.com')).toBe(true);
    expect(() => buildChatMessage(actor, {
      chat_id: 'listener@example.com|peer@example.com',
      content: 'WhatsApp me at +1 555 123 4567',
    })).toThrowError('contact_blocked');
  });

  it('supports legacy and peer-scoped read markers', () => {
    expect(lastSeenFor({ messages_last_seen: '2026-01-01T00:00:00Z' }, 'peer@example.com')).toBeGreaterThan(0);
    expect(lastSeenFor({ messages_last_seen: { 'peer@example.com': '2026-01-02T00:00:00Z' } }, 'peer@example.com'))
      .toBeGreaterThan(0);
  });
});

describe('review calculations', () => {
  it('deduplicates a voter by latest vote', () => {
    const totals = reviewVoteTotals([
      { id: '1', voter_email: 'a@example.com', vote: 'like', created_date: '2026-01-01' },
      { id: '2', voter_email: 'a@example.com', vote: 'dislike', created_date: '2026-01-02' },
      { id: '3', voter_email: 'b@example.com', vote: 'like', created_date: '2026-01-03' },
    ]);
    expect(totals).toEqual({ likes_count: 1, dislikes_count: 1 });
  });

  it('excludes pending reviews from album ratings', () => {
    expect(albumRating([
      { rating: 5, moderation_status: 'approved' },
      { rating: 1, moderation_status: 'pending_review' },
      { rating: 4 },
    ])).toEqual({ review_count: 2, avg_rating: 4.5 });
  });
});
