import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
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

describe('private media stays behind a signature', () => {
  it('does not serve a private object through a public path', async () => {
    const app = await buildApp({ logger: false });
    const secret = path.resolve('var/uploads/podcasts/secret.txt');
    await mkdir(path.dirname(secret), { recursive: true });
    await writeFile(secret, 'private-audio');
    try {
      const escaped = await app.inject({
        method: 'GET',
        url: '/api/media/public/%2e%2e/podcasts/secret.txt',
      });
      assert.ok([403, 404].includes(escaped.statusCode));
      assert.equal(escaped.body.includes('private-audio'), false);

      const unsigned = await app.inject({
        method: 'GET',
        url: '/api/media/podcasts/secret.txt',
      });
      assert.equal(unsigned.statusCode, 403);
      assert.equal(unsigned.json().error, 'invalid_signature');
      assert.equal(unsigned.body.includes('private-audio'), false);
    } finally {
      await rm(secret, { force: true });
      await app.close();
    }
  });
});
