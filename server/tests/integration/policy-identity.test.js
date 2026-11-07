import { beforeAll, describe, expect, it } from 'vitest';
import { bearer, invokeFunction, registerMember } from './helpers.js';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
});

describe('member identity boundaries', () => {
  it('keeps public catalogs open and private collections signed-in', async () => {
    const app = await buildApp({ logger: false });
    const author = await registerMember(app, 'author');
    const reader = await registerMember(app, 'reader');

    const review = await app.inject({
      method: 'POST',
      url: '/api/entities/Review',
      headers: bearer(author.token),
      payload: {
        title: 'Public notes',
        body: 'Approved for guests.',
        moderation_status: 'approved',
        reviewer_email: author.user.email,
        reviewer_name: 'Author',
      },
    });
    expect(review.statusCode).toBe(200);

    const guestReviews = await app.inject({
      method: 'POST',
      url: '/api/entities/Review/filter',
      payload: { filter: { id: review.json().id }, limit: 5 },
    });
    expect(guestReviews.statusCode).toBe(200);
    expect(guestReviews.json()).toHaveLength(1);

    const guestChat = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/filter',
      payload: { filter: {}, limit: 5 },
    });
    expect(guestChat.statusCode).toBe(401);
    expect(guestChat.json().error).toBe('auth_required');

    const guestUsers = await app.inject({
      method: 'POST',
      url: '/api/entities/User/filter',
      payload: { filter: { id: reader.user.id }, limit: 5 },
    });
    expect(guestUsers.statusCode).toBe(401);

    const crossUser = await app.inject({
      method: 'POST',
      url: '/api/entities/User/filter',
      headers: bearer(reader.token),
      payload: { filter: { email: author.user.email }, limit: 5 },
    });
    expect(crossUser.json()).toEqual([]);

    await app.close();
  });

  it('searches by nickname and still returns email only on an authorized profile', async () => {
    const app = await buildApp({ logger: false });
    const alice = await registerMember(app, 'alice');
    const bob = await registerMember(app, 'bob');

    const anonymous = await invokeFunction(app, '', 'searchUsers', { query: 'bob' });
    expect(anonymous.statusCode).toBe(401);

    const byEmail = await invokeFunction(app, alice.token, 'searchUsers', { query: bob.user.email });
    expect(byEmail.json().results).toEqual([]);

    const byName = await invokeFunction(app, alice.token, 'searchUsers', { query: 'bob' });
    expect(byName.statusCode).toBe(200);
    expect(byName.json().results.some((item) => item.id === bob.user.id)).toBe(true);
    expect(byName.json().results.every((item) => !('email' in item))).toBe(true);
    expect(byName.json().results.some((item) => item.id === alice.user.id)).toBe(false);

    const profile = await invokeFunction(app, alice.token, 'publicProfile', { user_id: bob.user.id });
    expect(profile.json()).toMatchObject({
      found: true,
      id: bob.user.id,
      email: bob.user.email,
      is_me: false,
    });
    expect(profile.json().full_name.includes('@')).toBe(false);

    const resolved = await invokeFunction(app, alice.token, 'resolveProfiles', { emails: [bob.user.email] });
    const entry = resolved.json().results[bob.user.email];
    expect(entry.name).toBeTruthy();
    expect(entry.email).toBeUndefined();

    await app.close();
  });
});
