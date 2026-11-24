import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildChatMessage, containsExternalContact, lastSeenFor } from '../../shared/chatPolicy.js';
import { albumRating, reviewVoteTotals } from '../../shared/reviews.js';
import { safeKey } from '../../storage/objectStorage.js';
import { html, renderHtml, safeNextPath, safeUrl } from '../../web/html.js';
import { getGenre } from '../../shared/genres.js';

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
    assert.equal(message.sender_email, actor.email);
    assert.deepEqual(message.participants, ['listener@example.com', 'peer@example.com']);
  });

  it('blocks off-platform contact information', () => {
    assert.equal(containsExternalContact('message me at person@example.com'), true);
    assert.throws(() => buildChatMessage(actor, {
      chat_id: 'listener@example.com|peer@example.com',
      content: 'WhatsApp me at +1 555 123 4567',
    }), /contact_blocked/);
  });

  it('supports legacy and peer-scoped read markers', () => {
    assert.ok(lastSeenFor({ messages_last_seen: '2026-01-01T00:00:00Z' }, 'peer@example.com') > 0);
    assert.ok(lastSeenFor({ messages_last_seen: { 'peer@example.com': '2026-01-02T00:00:00Z' } }, 'peer@example.com') > 0);
  });
});

describe('review calculations', () => {
  it('deduplicates a voter by latest vote', () => {
    const totals = reviewVoteTotals([
      { id: '1', voter_email: 'a@example.com', vote: 'like', created_date: '2026-01-01' },
      { id: '2', voter_email: 'a@example.com', vote: 'dislike', created_date: '2026-01-02' },
      { id: '3', voter_email: 'b@example.com', vote: 'like', created_date: '2026-01-03' },
    ]);
    assert.deepEqual(totals, { likes_count: 1, dislikes_count: 1 });
  });

  it('excludes pending reviews from album ratings', () => {
    assert.deepEqual(albumRating([
      { rating: 5, moderation_status: 'approved' },
      { rating: 1, moderation_status: 'pending_review' },
      { rating: 4 },
    ]), { review_count: 2, avg_rating: 4.5 });
  });
});

describe('storage keys and web HTML safety', () => {
  it('rejects paths that leave the storage root', () => {
    assert.equal(safeKey('public/covers/cover.jpg'), 'public/covers/cover.jpg');
    assert.throws(() => safeKey('public/../podcasts/secret.mp3'), /Invalid storage key/);
    assert.throws(() => safeKey('../secret.mp3'), /Invalid storage key/);
    assert.throws(() => safeKey('/etc/passwd'), /Invalid storage key/);
  });

  it('escapes interpolated HTML and rejects unsafe URLs and redirects', () => {
    const rendered = renderHtml(html`<p>${'<script>alert(1)</script>'}</p>`);
    assert.equal(rendered, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    assert.equal(safeUrl('javascript:alert(1)'), '');
    assert.equal(safeUrl('https://example.com/cover.jpg'), 'https://example.com/cover.jpg');
    assert.equal(safeNextPath('//evil.example/phish'), '/');
    assert.equal(safeNextPath('/reviews'), '/reviews');
    assert.equal(getGenre('rnb')?.id, 'r_and_b');
    assert.equal(getGenre('punk')?.id, 'core');
  });
});
