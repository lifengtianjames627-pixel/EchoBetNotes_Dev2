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

describe('HTTP observability', () => {
  it('returns and echoes a valid x-request-id on health checks', async () => {
    const app = await buildApp({ logger: false });
    const incoming = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

    const health = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { 'x-request-id': incoming },
    });

    assert.equal(health.statusCode, 200);
    assert.equal(health.headers['x-request-id'], incoming);
    assert.equal(health.headers['cache-control'], 'no-store');
    assert.equal(health.headers['x-content-type-options'], 'nosniff');
    assert.equal(health.headers['x-frame-options'], 'DENY');
    assert.deepEqual(health.json(), { status: 'ok', checks: { database: 'ok' } });

    await app.close();
  });

  it('includes requestId on API 404 errors', async () => {
    const app = await buildApp({ logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/api/does-not-exist',
    });
    assert.equal(response.statusCode, 404);
    assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/i);
    assert.equal(response.json().error, 'not_found');
    assert.equal(response.json().requestId, response.headers['x-request-id']);
    await app.close();
  });
});
