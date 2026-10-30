import { beforeAll, describe, expect, it } from 'vitest';
import { bearer, invokeFunction, registerMember } from './helpers.js';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
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
    expect(created.statusCode).toBe(200);
    const subscriptionId = created.json().id;
    expect(created.json().subscriber_email).toBe(follower.user.email);

    const creatorView = await app.inject({
      method: 'POST',
      url: '/api/entities/Subscription/filter',
      headers: bearer(creator.token),
      payload: { filter: { target_email: creator.user.email }, limit: 10 },
    });
    expect(creatorView.json()).toHaveLength(0);

    const deleteAttempt = await app.inject({
      method: 'DELETE',
      url: `/api/entities/Subscription/${subscriptionId}`,
      headers: bearer(creator.token),
    });
    expect(deleteAttempt.statusCode).toBe(403);

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
    expect(directCreate.statusCode).toBe(403);
    expect(directCreate.json().error).toBe('function_required');
    expect(directCreate.json().requestId).toBeTruthy();

    const sent = await invokeFunction(app, sender.token, 'friendRequests', {
      action: 'send',
      target_email: receiver.user.email,
      message: 'Want to connect?',
    });
    expect(sent.statusCode).toBe(200);
    const requestId = sent.json().request.id;

    const outsiderRespond = await invokeFunction(app, outsider.token, 'friendRequests', {
      action: 'respond',
      id: requestId,
      status: 'accepted',
    });
    expect(outsiderRespond.statusCode).toBe(403);

    const senderRespond = await invokeFunction(app, sender.token, 'friendRequests', {
      action: 'respond',
      id: requestId,
      status: 'accepted',
    });
    expect(senderRespond.statusCode).toBe(403);

    const accepted = await invokeFunction(app, receiver.token, 'friendRequests', {
      action: 'respond',
      id: requestId,
      status: 'accepted',
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json().request.status).toBe('accepted');

    const outsiderRead = await app.inject({
      method: 'POST',
      url: '/api/entities/FriendRequest/filter',
      headers: bearer(outsider.token),
      payload: { filter: { id: requestId }, limit: 5 },
    });
    expect(outsiderRead.json()).toHaveLength(0);

    await app.close();
  });
});
