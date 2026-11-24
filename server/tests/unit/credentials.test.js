import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertValidEmail,
  assertValidPassword,
  parseLoginBody,
  parseRegistrationBody,
} from '../../auth/credentials.js';

describe('auth credentials parsing', () => {
  it('normalizes email and accepts display_name alias', () => {
    const parsed = parseRegistrationBody({
      email: ' Listener@Example.com ',
      password: 'long-enough-password',
      display_name: 'Listener',
    });
    assert.equal(parsed.email, 'listener@example.com');
    assert.equal(parsed.displayName, 'Listener');
  });

  it('rejects invalid email and short passwords', () => {
    assert.throws(() => assertValidEmail('not-an-email'), /valid email/i);
    assert.throws(() => assertValidPassword('short'), /10 and 200/i);
  });

  it('parses login bodies without throwing on missing password', () => {
    assert.deepEqual(parseLoginBody({ email: 'A@B.com', password: 'secret' }), {
      email: 'a@b.com',
      password: 'secret',
    });
  });
});
