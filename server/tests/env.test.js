import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config/env.js';

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://echoes:secret@database:5432/echoes',
  JWT_SECRET: 'production-secret-must-be-32-characters',
};

describe('production configuration', () => {
  it('keeps the bundled database on a plain connection unless TLS is requested', () => {
    expect(loadConfig({ ...production, DATABASE_SSL: 'false' }).databaseSsl).toBe(false);
    expect(loadConfig(production).databaseSsl).toBe(true);
  });

  it('requires a database URL and a long session secret in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: production.JWT_SECRET })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ ...production, JWT_SECRET: 'too-short' })).toThrow(/JWT_SECRET/);
  });

  it('closes registration by default and honors an explicit bootstrap switch', () => {
    expect(loadConfig(production).allowRegistration).toBe(false);
    expect(loadConfig({ ...production, ALLOW_REGISTRATION: 'true' }).allowRegistration).toBe(true);
    expect(loadConfig({ ...production, COOKIE_SECURE: 'false' }).cookieSecure).toBe(false);
  });
});
