import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { buildApp } from '../../app.js';
import { createTestDatabase } from './setup.js';

let testDb;

before(async () => {
  testDb = await createTestDatabase();
});

after(async () => {
  await testDb.close();
});

describe('auth HTTP routes', () => {
  it('registers, authenticates via bearer token, and logs out', async () => {
    const app = await buildApp({ logger: false });

    const register = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'listener@example.com',
        password: 'correct-horse-battery',
        displayName: 'Listener',
      },
    });
    assert.equal(register.statusCode, 200);
    assert.match(register.headers['x-request-id'], /^[0-9a-f-]{36}$/i);
    const registerBody = register.json();
    assert.equal(registerBody.user.email, 'listener@example.com');
    assert.match(registerBody.access_token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${registerBody.access_token}` },
    });
    assert.equal(me.statusCode, 200);
    assert.equal(me.json().display_name, 'Listener');

    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { authorization: `Bearer ${registerBody.access_token}` },
    });
    assert.equal(logout.statusCode, 200);

    const meAfterLogout = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${registerBody.access_token}` },
    });
    assert.equal(meAfterLogout.statusCode, 401);
    assert.ok(meAfterLogout.json().requestId);

    await app.close();
  });

  it('rejects duplicate registration and invalid credentials', async () => {
    const app = await buildApp({ logger: false });

    const payload = {
      email: 'dup@example.com',
      password: 'correct-horse-battery',
      displayName: 'Dup',
    };
    assert.equal((await app.inject({ method: 'POST', url: '/api/auth/register', payload })).statusCode, 200);
    assert.equal((await app.inject({ method: 'POST', url: '/api/auth/register', payload })).statusCode, 409);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: payload.email, password: 'wrong-password-value' },
    });
    assert.equal(login.statusCode, 401);
    assert.equal(login.json().error, 'invalid_credentials');
    assert.equal(login.json().message, 'Invalid email or password');

    await app.close();
  });
});
