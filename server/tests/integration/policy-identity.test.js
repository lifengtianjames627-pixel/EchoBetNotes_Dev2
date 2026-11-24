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
        content: 'Approved for guests.',
        moderation_status: 'approved',
        reviewer_email: author.user.email,
        reviewer_name: 'Author',
      },
    });
    assert.equal(review.statusCode, 200);

    const guestReviews = await app.inject({
      method: 'POST',
      url: '/api/entities/Review/filter',
      payload: { filter: { id: review.json().id }, limit: 5 },
    });
    assert.equal(guestReviews.statusCode, 200);
    assert.equal(guestReviews.json().length, 1);

    const guestChat = await app.inject({
      method: 'POST',
      url: '/api/entities/ChatMessage/filter',
      payload: { filter: {}, limit: 5 },
    });
    assert.equal(guestChat.statusCode, 401);
    assert.equal(guestChat.json().error, 'auth_required');

    const guestUsers = await app.inject({
      method: 'POST',
      url: '/api/entities/User/filter',
      payload: { filter: { id: reader.user.id }, limit: 5 },
    });
    assert.equal(guestUsers.statusCode, 401);

    const crossUser = await app.inject({
      method: 'POST',
      url: '/api/entities/User/filter',
      headers: bearer(reader.token),
      payload: { filter: { email: author.user.email }, limit: 5 },
    });
    assert.deepEqual(crossUser.json(), []);

    await app.close();
  });

  it('searches by nickname and returns email only on an authorized profile', async () => {
    const app = await buildApp({ logger: false });
    const alice = await registerMember(app, 'alice');
    const bob = await registerMember(app, 'bob');

    const anonymous = await invokeFunction(app, '', 'searchUsers', { query: 'bob' });
    assert.equal(anonymous.statusCode, 401);

    const byEmail = await invokeFunction(app, alice.token, 'searchUsers', { query: bob.user.email });
    assert.deepEqual(byEmail.json().results, []);

    const byName = await invokeFunction(app, alice.token, 'searchUsers', { query: 'bob' });
    assert.equal(byName.statusCode, 200);
    assert.equal(byName.json().results.some((item) => item.id === bob.user.id), true);
    assert.equal(byName.json().results.every((item) => !('email' in item)), true);
    assert.equal(byName.json().results.some((item) => item.id === alice.user.id), false);

    const profile = await invokeFunction(app, alice.token, 'publicProfile', { user_id: bob.user.id });
    assert.equal(profile.json().found, true);
    assert.equal(profile.json().id, bob.user.id);
    assert.equal(profile.json().email, bob.user.email);
    assert.equal(profile.json().is_me, false);
    assert.equal(profile.json().full_name.includes('@'), false);

    const resolved = await invokeFunction(app, alice.token, 'resolveProfiles', { emails: [bob.user.email] });
    const entry = resolved.json().results[bob.user.email];
    assert.ok(entry.name);
    assert.equal(entry.email, undefined);

    await app.close();
  });
});
