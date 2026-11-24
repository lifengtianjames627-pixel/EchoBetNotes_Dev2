import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { buildApp } from '../../app.js';
import { bearer, registerMember } from './helpers.js';
import { createTestDatabase } from './setup.js';

let testDb;

before(async () => {
  testDb = await createTestDatabase();
});

after(async () => {
  await testDb.close();
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
    assert.equal(created.statusCode, 200);
    const pinId = created.json().id;

    const ownerList = await app.inject({
      method: 'POST',
      url: '/api/entities/PinnedPeer/filter',
      headers: bearer(owner.token),
      payload: { filter: { owner_email: owner.user.email }, limit: 10 },
    });
    assert.equal(ownerList.json().length, 1);

    const otherList = await app.inject({
      method: 'POST',
      url: '/api/entities/PinnedPeer/filter',
      headers: bearer(other.token),
      payload: { filter: { owner_email: owner.user.email }, limit: 10 },
    });
    assert.equal(otherList.json().length, 0);

    const deleteAttempt = await app.inject({
      method: 'DELETE',
      url: `/api/entities/PinnedPeer/${pinId}`,
      headers: bearer(other.token),
    });
    assert.equal(deleteAttempt.statusCode, 403);
    assert.equal(deleteAttempt.json().error, 'forbidden');
    assert.ok(deleteAttempt.json().requestId);

    const chatWrite = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage',
      headers: bearer(owner.token),
      payload: { content: 'hello' },
    });
    assert.equal(chatWrite.statusCode, 403);
    assert.equal(chatWrite.json().error, 'function_required');

    await app.close();
  });
});
