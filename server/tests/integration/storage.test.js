import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
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
      expect([403, 404]).toContain(escaped.statusCode);
      expect(escaped.body).not.toContain('private-audio');

      const unsigned = await app.inject({
        method: 'GET',
        url: '/api/media/podcasts/secret.txt',
      });
      expect(unsigned.statusCode).toBe(403);
      expect(unsigned.json().error).toBe('invalid_signature');
      expect(unsigned.body).not.toContain('private-audio');
    } finally {
      await rm(secret, { force: true });
      await app.close();
    }
  });
});
