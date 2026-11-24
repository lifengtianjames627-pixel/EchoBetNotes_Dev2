import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { buildApp } from '../../app.js';
import { entity } from '../../entities/repository.js';
import { bearer, registerMember } from './helpers.js';
import { createTestDatabase } from './setup.js';

let testDb;

before(async () => {
  testDb = await createTestDatabase();
});

after(async () => {
  await testDb.close();
});

describe('Node.js server-rendered web pages', () => {
  it('serves public pages and static assets without React or Vite', async () => {
    const app = await buildApp({ logger: false });

    for (const url of ['/', '/reviews', '/discover', '/podcasts', '/podcasts/youth_ears_lab', '/genre/rock', '/genre/rnb', '/about', '/privacy', '/terms', '/login']) {
      const response = await app.inject({ method: 'GET', url });
      assert.equal(response.statusCode, 200, `expected 200 on ${url}`);
      assert.match(response.headers['content-type'], /text\/html/);
      assert.ok(response.body.includes('/styles/paper.css'));
      assert.ok(response.body.includes('/js/app.js'));
    }

    const css = await app.inject({ method: 'GET', url: '/styles/paper.css' });
    assert.equal(css.statusCode, 200);
    assert.ok(css.body.includes('--paper-bg: #f3efe6'));

    const js = await app.inject({ method: 'GET', url: '/js/app.js' });
    assert.equal(js.statusCode, 200);

    const legacyRedirect = await app.inject({ method: 'GET', url: '/band-dashboard' });
    assert.equal(legacyRedirect.statusCode, 302);
    assert.equal(legacyRedirect.headers.location, '/soulmate');

    const notFound = await app.inject({ method: 'GET', url: '/no-such-page' });
    assert.equal(notFound.statusCode, 404);
    assert.match(notFound.headers['content-type'], /text\/html/);

    await app.close();
  });

  it('enforces auth and admin boundaries and escapes user-supplied HTML', async () => {
    const app = await buildApp({ logger: false });

    for (const url of ['/profile', '/chat', '/soulmate', '/moderation', '/manage']) {
      const guest = await app.inject({ method: 'GET', url });
      assert.equal(guest.statusCode, 302, `expected redirect for guest on ${url}`);
      assert.ok(guest.headers.location.startsWith('/login?next='));
    }

    const member = await registerMember(app, 'listener');
    const admin = await registerMember(app, 'editor');
    await entity('User').update(admin.user.id, { role: 'admin' });

    const createdAlbum = await app.inject({
      method: 'POST',
      url: '/api/entities/Album',
      headers: bearer(member.token),
      payload: {
        title: '<b>Injected Album</b>',
        artist: 'Test Band',
        genre: 'jazz',
        type: 'album',
      },
    });
    assert.equal(createdAlbum.statusCode, 200);
    const albumId = createdAlbum.json().id;

    const albumPage = await app.inject({ method: 'GET', url: `/album/${albumId}` });
    assert.equal(albumPage.statusCode, 200);
    assert.ok(albumPage.body.includes('&lt;b&gt;Injected Album&lt;/b&gt;'));
    assert.equal(albumPage.body.includes('<b>Injected Album</b>'), false);

    const memberProfile = await app.inject({
      method: 'GET',
      url: '/profile',
      headers: bearer(member.token),
    });
    assert.equal(memberProfile.statusCode, 200);

    const memberSoulmate = await app.inject({
      method: 'GET',
      url: '/soulmate',
      headers: bearer(member.token),
    });
    assert.equal(memberSoulmate.statusCode, 200);
    assert.ok(memberSoulmate.body.includes('Safety'));

    const memberModeration = await app.inject({
      method: 'GET',
      url: '/moderation',
      headers: bearer(member.token),
    });
    assert.equal(memberModeration.statusCode, 403);

    const adminModeration = await app.inject({
      method: 'GET',
      url: '/moderation',
      headers: bearer(admin.token),
    });
    assert.equal(adminModeration.statusCode, 200);

    const langSwitch = await app.inject({ method: 'GET', url: '/lang?code=zh&next=/reviews' });
    assert.equal(langSwitch.statusCode, 302);
    assert.equal(langSwitch.headers.location, '/reviews');
    assert.ok(String(langSwitch.headers['set-cookie'] || '').includes('lang=zh'));

    await app.close();
  });
});
