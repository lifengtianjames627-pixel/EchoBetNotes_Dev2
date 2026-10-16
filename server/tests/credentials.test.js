import { describe, expect, it } from 'vitest';
import {
  assertValidEmail,
  assertValidPassword,
  parseLoginBody,
  parseRegistrationBody,
} from '../auth/credentials.js';

describe('auth credentials parsing', () => {
  it('normalizes email and accepts display_name alias', () => {
    const parsed = parseRegistrationBody({
      email: ' Listener@Example.com ',
      password: 'long-enough-password',
      display_name: 'Listener',
    });
    expect(parsed.email).toBe('listener@example.com');
    expect(parsed.displayName).toBe('Listener');
  });

  it('rejects invalid email and short passwords', () => {
    expect(() => assertValidEmail('not-an-email')).toThrow(/valid email/i);
    expect(() => assertValidPassword('short')).toThrow(/10 and 200/i);
  });

  it('parses login bodies without throwing on missing password', () => {
    expect(parseLoginBody({ email: 'A@B.com', password: 'secret' })).toEqual({
      email: 'a@b.com',
      password: 'secret',
    });
  });
});
