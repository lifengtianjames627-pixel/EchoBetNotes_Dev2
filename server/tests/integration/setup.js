import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, vi } from 'vitest';

const integrationDb = vi.hoisted(() => ({ database: null }));

vi.mock('../../db/pool.js', () => ({
  pool: {
    query: (...args) => integrationDb.database.query(...args),
    connect: async () => ({
      query: (...args) => integrationDb.database.query(...args),
      release: () => {},
    }),
  },
  withTransaction: async (callback) => {
    await integrationDb.database.query('BEGIN');
    try {
      const result = await callback({
        query: (...args) => integrationDb.database.query(...args),
      });
      await integrationDb.database.query('COMMIT');
      return result;
    } catch (error) {
      await integrationDb.database.query('ROLLBACK');
      throw error;
    }
  },
  closePool: async () => integrationDb.database.close(),
}));

beforeAll(async () => {
  integrationDb.database = new PGlite();
  const migration = await readFile(
    new URL('../../db/migrations/001_initial.sql', import.meta.url),
    'utf8',
  );
  await integrationDb.database.exec(migration);
});

afterAll(async () => {
  await integrationDb.database.close();
});
