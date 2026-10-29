import { beforeAll, describe, expect, it } from 'vitest';

let buildApp;

beforeAll(async () => {
  ({ buildApp } = await import('../../app.js'));
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

    expect(health.statusCode).toBe(200);
    expect(health.headers['x-request-id']).toBe(incoming);
    expect(health.headers['cache-control']).toBe('no-store');
    expect(health.json()).toMatchObject({ status: 'ok', checks: { database: 'ok' } });

    await app.close();
  });

  it('includes requestId on API 404 errors', async () => {
    const app = await buildApp({ logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/api/does-not-exist',
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(response.json()).toMatchObject({
      error: 'not_found',
      requestId: response.headers['x-request-id'],
    });
    await app.close();
  });
});
