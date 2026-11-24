import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadConfig } from '../../config/env.js';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://echoes:secret@database:5432/echoes',
  JWT_SECRET: 'production-secret-must-be-32-characters',
};

describe('production configuration', () => {
  it('keeps the bundled database on a plain connection unless TLS is requested', () => {
    assert.equal(loadConfig({ ...production, DATABASE_SSL: 'false' }).databaseSsl, false);
    assert.equal(loadConfig(production).databaseSsl, true);
  });

  it('requires a database URL and a long session secret in production', () => {
    assert.throws(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: production.JWT_SECRET }), /DATABASE_URL/);
    assert.throws(() => loadConfig({ ...production, JWT_SECRET: 'too-short' }), /JWT_SECRET/);
  });

  it('closes registration by default and honors an explicit bootstrap switch', () => {
    assert.equal(loadConfig(production).allowRegistration, false);
    assert.equal(loadConfig({ ...production, ALLOW_REGISTRATION: 'true' }).allowRegistration, true);
    assert.equal(loadConfig({ ...production, COOKIE_SECURE: 'false' }).cookieSecure, false);
  });
});
