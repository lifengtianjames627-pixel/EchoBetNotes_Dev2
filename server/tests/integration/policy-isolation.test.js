import { beforeAll, describe, expect, it } from 'vitest';
import { bearer, registerMember } from './helpers.js';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
});

describe('entity policy isolation', () => {
  it('keeps pinned peers private to the owner and blocks workflow-only writes', async () => {
    const app = await buildApp({ logger: false });
    const owner = await registerMember(app, 'owner');
    const other = await registerMember(app, 'other');

    const created = await app.inject({
      method: 'POST',
      url: '/api/entities/PinnedPeer',
      headers: bearer(owner.token),
      payload: {
        peer_email: 'peer@example.com',
        peer_name: 'Peer',
      },
    });
    expect(created.statusCode).toBe(200);
    const pinId = created.json().id;

    const ownerList = await app.inject({
      method: 'POST',
      url: '/api/entities/PinnedPeer/filter',
      headers: bearer(owner.token),
      payload: { filter: { owner_email: owner.user.email }, limit: 10 },
    });
    expect(ownerList.json()).toHaveLength(1);

    const otherList = await app.inject({
      method: 'POST',
      url: '/api/entities/PinnedPeer/filter',
      headers: bearer(other.token),
      payload: { filter: { owner_email: owner.user.email }, limit: 10 },
    });
    expect(otherList.json()).toHaveLength(0);

    const deleteAttempt = await app.inject({
      method: 'DELETE',
      url: `/api/entities/PinnedPeer/${pinId}`,
      headers: bearer(other.token),
    });
    expect(deleteAttempt.statusCode).toBe(403);
    expect(deleteAttempt.json().error).toBe('forbidden');
    expect(deleteAttempt.json().requestId).toBeTruthy();

    const chatWrite = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage',
      headers: bearer(owner.token),
      payload: { content: 'hello' },
    });
    expect(chatWrite.statusCode).toBe(403);
    expect(chatWrite.json().error).toBe('function_required');

    await app.close();
  });
});
