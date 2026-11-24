import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

let pgPool = null;
let overridePool = null;

function activePool() {
  if (overridePool) return overridePool;
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
      max: 15,
      idleTimeoutMillis: 30_000,
    });
  }
  return pgPool;
}

export const pool = {
  query: (...args) => activePool().query(...args),
  connect: () => activePool().connect(),
  end: async () => {
    if (overridePool?.end) {
      await overridePool.end();
      overridePool = null;
    }
    if (pgPool) {
      const closing = pgPool;
      pgPool = null;
      await closing.end();
    }
  },
};

export function setTestPool(adapter) {
  overridePool = adapter;
}

export function resetTestPool() {
  overridePool = null;
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
