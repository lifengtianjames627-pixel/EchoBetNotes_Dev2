import { describe, expect, it } from 'vitest';
import { assertEntityOperation, canReadRecord, prepareEntityInput } from '../entities/policies.js';

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
    expect(prepareEntityInput('RecruitPost', member, {}).moderation_status)
      .toBe('pending_review');
  });
});
