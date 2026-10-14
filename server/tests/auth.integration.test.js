import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const dbState = vi.hoisted(() => ({ database: null }));

vi.mock('../db/pool.js', () => ({
  pool: {
    query: (...args) => dbState.database.query(...args),
    connect: async () => ({
      query: (...args) => dbState.database.query(...args),
      release: () => {},
    }),
  },
  withTransaction: async (callback) => {
    await dbState.database.query('BEGIN');
    try {
      const result = await callback({
        query: (...args) => dbState.database.query(...args),
      });
      await dbState.database.query('COMMIT');
      return result;
    } catch (error) {
      await dbState.database.query('ROLLBACK');
      throw error;
    }
  },
  closePool: async () => dbState.database.close(),
}));

let buildApp;

beforeAll(async () => {
  dbState.database = new PGlite();
  const migration = await readFile(new URL('../db/migrations/001_initial.sql', import.meta.url), 'utf8');
  await dbState.database.exec(migration);
  ({ buildApp } = await import('../app.js'));
});

afterAll(async () => {
  await dbState.database.close();
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
