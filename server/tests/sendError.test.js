import { describe, expect, it, vi } from 'vitest';
import { sendApiError } from '../http/sendError.js';

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
    expect(body).toEqual({
      error: 'function_required',
      message: 'Use the dedicated workflow endpoint',
      requestId: request.requestId,
    });
    expect(reply.headers['x-error-code']).toBe('function_required');
  });
});
