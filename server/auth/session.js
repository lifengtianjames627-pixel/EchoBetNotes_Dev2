import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { entity, newId } from '../entities/repository.js';
import { pool, withTransaction } from '../db/pool.js';

const secret = new TextEncoder().encode(config.jwtSecret);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 200) {
    throw Object.assign(new Error('Password must contain between 10 and 200 characters'), { statusCode: 400 });
  }
  return bcrypt.hash(password, 12);
}

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export async function createAccount({ email, password, displayName }) {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw Object.assign(new Error('A valid email is required'), { statusCode: 400 });
  }
  const passwordHash = await hashPassword(password);
  return withTransaction(async (client) => {
    const exists = await client.query('SELECT 1 FROM auth_accounts WHERE email = $1', [normalizedEmail]);
    if (exists.rowCount) throw Object.assign(new Error('Account already exists'), { statusCode: 409 });
    const user = await entity('User', client).create({
      email: normalizedEmail,
      display_name: String(displayName || '').trim().slice(0, 120),
      full_name: String(displayName || '').trim().slice(0, 120),
      role: normalizeEmail(config.bootstrapAdminEmail) === normalizedEmail ? 'admin' : 'user',
      equipped_badges: [],
    });
    await client.query(
      'INSERT INTO auth_accounts(user_id, email, password_hash) VALUES ($1, $2, $3)',
      [user.id, normalizedEmail, passwordHash],
    );
    return user;
  });
}

export async function authenticateCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const account = await pool.query(
    'SELECT user_id, password_hash FROM auth_accounts WHERE email = $1',
    [normalizedEmail],
  );
  if (!account.rows[0] || !(await verifyPassword(String(password || ''), account.rows[0].password_hash))) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }
  return entity('User').find(account.rows[0].user_id);
}

export async function issueSession(user) {
  const sessionId = newId();
  const expiresAt = new Date(Date.now() + config.sessionDays * 86_400_000);
  await pool.query(
    'INSERT INTO auth_sessions(id, user_id, expires_at) VALUES ($1, $2, $3)',
    [sessionId, user.id, expiresAt],
  );
  const token = await new SignJWT({ sid: sessionId, email: user.email, role: user.role || 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(config.jwtIssuer)
    .setIssuedAt()
    .setExpirationTime(config.accessTokenTtl)
    .sign(secret);
  return { token, sessionId, expiresAt };
}

export async function resolveSession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: config.jwtIssuer });
    const session = await pool.query(
      `SELECT 1 FROM auth_sessions
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > now()`,
      [payload.sid, payload.sub],
    );
    if (!session.rowCount) return null;
    return entity('User').find(payload.sub);
  } catch {
    return null;
  }
}

export async function revokeSession(sessionId) {
  if (sessionId) {
    await pool.query('UPDATE auth_sessions SET revoked_at = now() WHERE id = $1', [sessionId]);
  }
}

export async function sessionIdFromToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: config.jwtIssuer });
    return payload.sid || null;
  } catch {
    return null;
  }
}

export function tokenFromRequest(request) {
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return request.cookies?.session || null;
}
