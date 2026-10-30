import { describe, expect, it } from 'vitest';
import { readOrCreateRequestId } from '../http/requestId.js';

describe('request id helper', () => {
  it('reuses a valid incoming UUID', () => {
    const incoming = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    expect(readOrCreateRequestId(incoming)).toBe(incoming);
    expect(readOrCreateRequestId(` ${incoming.toUpperCase()} `)).toBe(incoming);
  });

  it('generates a UUID when the header is missing or invalid', () => {
    const generated = readOrCreateRequestId('not-a-uuid');
    expect(generated).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
