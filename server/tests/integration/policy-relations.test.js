import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { buildApp } from '../../app.js';
import { bearer, invokeFunction, registerMember } from './helpers.js';
import { createTestDatabase } from './setup.js';

let testDb;

before(async () => {
  testDb = await createTestDatabase();
});

after(async () => {
  await testDb.close();
});

describe('subscription and friend-request policies', () => {
  it('scopes subscriptions to the subscriber and blocks forged ownership', async () => {
    const app = await buildApp({ logger: false });
    const follower = await registerMember(app, 'follower');
    const creator = await registerMember(app, 'creator');

    const created = await app.inject({
      method: 'POST',
      url: '/api/entities/Subscription',
      headers: bearer(follower.token),
      payload: {
        subscriber_email: 'attacker@example.com',
        target_email: creator.user.email,
        target_name: 'Creator',
        subscriber_name: 'Follower',
      },
    });
    assert.equal(created.statusCode, 200);
    const subscriptionId = created.json().id;
    assert.equal(created.json().subscriber_email, follower.user.email);

    const creatorView = await app.inject({
      method: 'POST',
      url: '/api/entities/Subscription/filter',
      headers: bearer(creator.token),
      payload: { filter: { target_email: creator.user.email }, limit: 10 },
    });
    assert.equal(creatorView.json().length, 0);

    const deleteAttempt = await app.inject({
      method: 'DELETE',
      url: `/api/entities/Subscription/${subscriptionId}`,
      headers: bearer(creator.token),
    });
    assert.equal(deleteAttempt.statusCode, 403);

    await app.close();
  });

  it('routes friend requests through the workflow and enforces responder rules', async () => {
    const app = await buildApp({ logger: false });
    const sender = await registerMember(app, 'sender');
    const receiver = await registerMember(app, 'receiver');
    const outsider = await registerMember(app, 'outsider');

    const directCreate = await app.inject({
      method: 'POST',
      url: '/api/entities/FriendRequest',
      headers: bearer(sender.token),
      payload: { from_email: sender.user.email, to_email: receiver.user.email },
    });
    assert.equal(directCreate.statusCode, 403);
    assert.equal(directCreate.json().error, 'function_required');
    assert.ok(directCreate.json().requestId);

    const sent = await invokeFunction(app, sender.token, 'friendRequests', {
      action: 'send',
      target_email: receiver.user.email,
      message: 'Want to connect?',
    });
    assert.equal(sent.statusCode, 200);
    const requestId = sent.json().request.id;

    const outsiderRespond = await invokeFunction(app, outsider.token, 'friendRequests', {
      action: 'respond',
      id: requestId,
      status: 'accepted',
    });
    assert.equal(outsiderRespond.statusCode, 403);

    const senderRespond = await invokeFunction(app, sender.token, 'friendRequests', {
      action: 'respond',
      id: requestId,
      status: 'accepted',
    });
    assert.equal(senderRespond.statusCode, 403);

    const accepted = await invokeFunction(app, receiver.token, 'friendRequests', {
      action: 'respond',
      id: requestId,
      status: 'accepted',
    });
    assert.equal(accepted.statusCode, 200);
    assert.equal(accepted.json().request.status, 'accepted');

    const outsiderRead = await app.inject({
      method: 'POST',
      url: '/api/entities/FriendRequest/filter',
      headers: bearer(outsider.token),
      payload: { filter: { id: requestId }, limit: 5 },
    });
    assert.equal(outsiderRead.json().length, 0);

    await app.close();
  });
});
