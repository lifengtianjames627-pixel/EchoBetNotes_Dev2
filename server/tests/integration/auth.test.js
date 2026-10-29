import { beforeAll, describe, expect, it } from 'vitest';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
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
    expect(register.statusCode).toBe(200);
    expect(register.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    const registerBody = register.json();
    expect(registerBody.user.email).toBe('listener@example.com');
    expect(registerBody.access_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${registerBody.access_token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().display_name).toBe('Listener');

    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { authorization: `Bearer ${registerBody.access_token}` },
    });
    expect(logout.statusCode).toBe(200);

    const meAfterLogout = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${registerBody.access_token}` },
    });
    expect(meAfterLogout.statusCode).toBe(401);
    expect(meAfterLogout.json().requestId).toBeTruthy();

    await app.close();
  });

  it('rejects duplicate registration and invalid credentials', async () => {
    const app = await buildApp({ logger: false });

    const payload = {
      email: 'dup@example.com',
      password: 'correct-horse-battery',
      displayName: 'Dup',
    };
    expect((await app.inject({ method: 'POST', url: '/api/auth/register', payload })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/auth/register', payload })).statusCode).toBe(409);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: payload.email, password: 'wrong-password-value' },
    });
    expect(login.statusCode).toBe(401);

    await app.close();
  });
});
