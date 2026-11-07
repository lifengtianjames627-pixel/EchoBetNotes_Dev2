import { beforeAll, describe, expect, it } from 'vitest';
import { chatIdFor } from '../../shared/identity.js';
import { bearer, invokeFunction, registerMember } from './helpers.js';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
});

describe('chat and notification privacy', () => {
  it('keeps messages between participants and blocks off-platform contact', async () => {
    const app = await buildApp({ logger: false });
    const alice = await registerMember(app, 'alice');
    const bob = await registerMember(app, 'bob');
    const carol = await registerMember(app, 'carol');
    const chatId = chatIdFor(alice.user.email, bob.user.email);

    const guest = await invokeFunction(app, '', 'sendChatMessage', { chat_id: chatId, content: 'hello' });
    expect(guest.statusCode).toBe(401);

    const sent = await invokeFunction(app, alice.token, 'sendChatMessage', { chat_id: chatId, content: 'hello' });
    expect(sent.statusCode).toBe(200);
    expect(sent.json().message.sender_email).toBe(alice.user.email);

    const outsider = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/filter',
      headers: bearer(carol.token),
      payload: { filter: { chat_id: chatId }, limit: 10 },
    });
    expect(outsider.json()).toEqual([]);

    const insider = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/filter',
      headers: bearer(bob.token),
      payload: { filter: { chat_id: chatId }, limit: 10 },
    });
    expect(insider.json()).toHaveLength(1);

    const blocked = await invokeFunction(app, alice.token, 'sendChatMessage', {
      chat_id: chatId,
      content: 'mail me at person@example.com',
    });
    expect(blocked.statusCode).toBe(400);
    expect(blocked.json().error).toBe('contact_blocked');

    const unread = await invokeFunction(app, bob.token, 'messageUnread', {});
    expect(unread.json().unread).toBeGreaterThanOrEqual(1);
    const carolUnread = await invokeFunction(app, carol.token, 'messageUnread', {});
    expect(carolUnread.json().unread).toBe(0);

    const directory = await invokeFunction(app, bob.token, 'chatDirectory', {});
    expect(directory.json().conversations.some((item) => item.peer_email === alice.user.email)).toBe(true);
    const carolDirectory = await invokeFunction(app, carol.token, 'chatDirectory', {});
    expect(carolDirectory.json().conversations).toEqual([]);

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
      expect(sent.statusCode).toBe(200);
    }
    const limited = await invokeFunction(app, alice.token, 'sendChatMessage', {
      chat_id: chatId,
      content: 'one more',
    });
    expect(limited.statusCode).toBe(403);
    expect(limited.json().error).toBe('message_limit');

    const created = await invokeFunction(app, alice.token, 'notifications', {
      action: 'create',
      owner_email: bob.user.email,
      type: 'follow',
      title: 'Alice followed you',
    });
    expect(created.statusCode).toBe(200);
    const notificationId = created.json().id;

    const bobList = await invokeFunction(app, bob.token, 'notifications', { action: 'list' });
    expect(bobList.json().items.some((item) => item.id === notificationId)).toBe(true);
    const aliceList = await invokeFunction(app, alice.token, 'notifications', { action: 'list' });
    expect(aliceList.json().items.some((item) => item.id === notificationId)).toBe(false);

    const hijack = await invokeFunction(app, carol.token, 'notifications', {
      action: 'markRead',
      id: notificationId,
    });
    expect(hijack.statusCode).toBe(404);

    const marked = await invokeFunction(app, bob.token, 'notifications', {
      action: 'markRead',
      id: notificationId,
    });
    expect(marked.json()).toMatchObject({ ok: true });

    const system = await invokeFunction(app, alice.token, 'notifications', {
      action: 'create',
      owner_email: bob.user.email,
      type: 'system',
      title: 'System',
    });
    expect(system.statusCode).toBe(403);

    await app.close();
  });
});