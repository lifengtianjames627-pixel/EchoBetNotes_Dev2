import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { buildApp } from '../../app.js';
import { chatIdFor } from '../../shared/identity.js';
import { bearer, invokeFunction, registerMember } from './helpers.js';
import { createTestDatabase } from './setup.js';

let testDb;

before(async () => {
  testDb = await createTestDatabase();
});

after(async () => {
  await testDb.close();
});

describe('chat and notification privacy', () => {
  it('keeps messages between participants and blocks off-platform contact', async () => {
    const app = await buildApp({ logger: false });
    const alice = await registerMember(app, 'alice');
    const bob = await registerMember(app, 'bob');
    const carol = await registerMember(app, 'carol');
    const chatId = chatIdFor(alice.user.email, bob.user.email);

    const guest = await invokeFunction(app, '', 'sendChatMessage', { chat_id: chatId, content: 'hello' });
    assert.equal(guest.statusCode, 401);

    const sent = await invokeFunction(app, alice.token, 'sendChatMessage', { chat_id: chatId, content: 'hello' });
    assert.equal(sent.statusCode, 200);
    assert.equal(sent.json().message.sender_email, alice.user.email);

    const outsider = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/filter',
      headers: bearer(carol.token),
      payload: { filter: { chat_id: chatId }, limit: 10 },
    });
    assert.deepEqual(outsider.json(), []);

    const insider = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/filter',
      headers: bearer(bob.token),
      payload: { filter: { chat_id: chatId }, limit: 10 },
    });
    assert.equal(insider.json().length, 1);

    const blocked = await invokeFunction(app, alice.token, 'sendChatMessage', {
      chat_id: chatId,
      content: 'mail me at person@example.com',
    });
    assert.equal(blocked.statusCode, 400);
    assert.equal(blocked.json().error, 'contact_blocked');

    const unread = await invokeFunction(app, bob.token, 'messageUnread', {});
    assert.ok(unread.json().unread >= 1);
    const carolUnread = await invokeFunction(app, carol.token, 'messageUnread', {});
    assert.equal(carolUnread.json().unread, 0);

    const directory = await invokeFunction(app, bob.token, 'chatDirectory', {});
    assert.equal(directory.json().conversations.some((item) => item.peer_email === alice.user.email), true);
    const carolDirectory = await invokeFunction(app, carol.token, 'chatDirectory', {});
    assert.deepEqual(carolDirectory.json().conversations, []);

    await app.close();
  });

  it('limits cold messages and keeps notifications with their owner', async () => {
    const app = await buildApp({ logger: false });
    const alice = await registerMember(app, 'alice');
    const bob = await registerMember(app, 'bob');
    const carol = await registerMember(app, 'carol');
    const chatId = chatIdFor(alice.user.email, bob.user.email);

    for (let index = 0; index < 3; index += 1) {
      const sent = await invokeFunction(app, alice.token, 'sendChatMessage', {
        chat_id: chatId,
        content: `note ${index}`,
      });
      assert.equal(sent.statusCode, 200);
    }
    const limited = await invokeFunction(app, alice.token, 'sendChatMessage', {
      chat_id: chatId,
      content: 'one more',
    });
    assert.equal(limited.statusCode, 403);
    assert.equal(limited.json().error, 'message_limit');

    const created = await invokeFunction(app, alice.token, 'notifications', {
      action: 'create',
      owner_email: bob.user.email,
      type: 'follow',
      title: 'Alice followed you',
    });
    assert.equal(created.statusCode, 200);
    const notificationId = created.json().id;

    const bobList = await invokeFunction(app, bob.token, 'notifications', { action: 'list' });
    assert.equal(bobList.json().items.some((item) => item.id === notificationId), true);
    const aliceList = await invokeFunction(app, alice.token, 'notifications', { action: 'list' });
    assert.equal(aliceList.json().items.some((item) => item.id === notificationId), false);

    const hijack = await invokeFunction(app, carol.token, 'notifications', {
      action: 'markRead',
      id: notificationId,
    });
    assert.equal(hijack.statusCode, 404);

    const marked = await invokeFunction(app, bob.token, 'notifications', {
      action: 'markRead',
      id: notificationId,
    });
    assert.equal(marked.json().ok, true);

    const system = await invokeFunction(app, alice.token, 'notifications', {
      action: 'create',
      owner_email: bob.user.email,
      type: 'system',
      title: 'System',
    });
    assert.equal(system.statusCode, 403);

    await app.close();
  });
});
