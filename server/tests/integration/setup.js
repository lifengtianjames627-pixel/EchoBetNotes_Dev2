import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { resetTestPool, setTestPool } from '../../db/pool.js';

export async function createTestDatabase() {
  const database = new PGlite();
  const migration = await readFile(
    new URL('../../db/migrations/001_initial.sql', import.meta.url),
    'utf8',
  );
  await database.exec(migration);

  setTestPool({
    query: (...args) => database.query(...args),
    connect: async () => ({
      query: (...args) => database.query(...args),
      release: () => {},
    }),
    end: async () => database.close(),
  });

  return {
    database,
    async close() {
      resetTestPool();
      await database.close();
    },
  };
}
