import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readOrCreateRequestId } from '../../http/requestId.js';
import { sendApiError } from '../../http/sendError.js';

describe('request id helper', () => {
  it('reuses a valid incoming UUID', () => {
    const incoming = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    assert.equal(readOrCreateRequestId(incoming), incoming);
    assert.equal(readOrCreateRequestId(` ${incoming.toUpperCase()} `), incoming);
  });

  it('generates a UUID when the header is missing or invalid', () => {
    const generated = readOrCreateRequestId('not-a-uuid');
    assert.match(generated, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

describe('sendApiError', () => {
  it('returns a stable JSON error shape with requestId', () => {
    const reply = {
      headers: {},
      statusCode: 200,
      header(name, value) {
        this.headers[name] = value;
        return this;
      },
      code(status) {
        this.statusCode = status;
        return this;
      },
      send(body) {
        this.body = body;
        return body;
      },
    };
    const request = { requestId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' };
    const body = sendApiError(reply, request, Object.assign(new Error('Use the dedicated workflow endpoint'), {
      statusCode: 403,
      code: 'function_required',
    }));
    assert.deepEqual(body, {
      error: 'function_required',
      message: 'Use the dedicated workflow endpoint',
      requestId: request.requestId,
    });
    assert.equal(reply.headers['x-error-code'], 'function_required');
  });
});
