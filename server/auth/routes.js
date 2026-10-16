import { config } from '../config/env.js';
import {
  createAccount,
  issueSession,
  loginWithBody,
  revokeSession,
  sessionIdFromToken,
  tokenFromRequest,
} from './session.js';
import { entity } from '../entities/repository.js';

const cookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSecure,
  maxAge: config.sessionDays * 86_400,
};

const sendSession = async (reply, user) => {
  const session = await issueSession(user);
  reply.setCookie('session', session.token, cookieOptions);
  return { access_token: session.token, user };
};

export async function authRoutes(app) {
  app.post('/api/auth/register', {
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    if (!config.allowRegistration) return reply.code(403).send({ error: 'registration_disabled' });
    const user = await createAccount(request.body || {});
    return sendSession(reply, user);
  });

  app.post('/api/auth/login', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const user = await loginWithBody(request.body);
    return sendSession(reply, user);
  });

  app.get('/api/auth/me', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'auth_required', message: 'Authentication required' });
    return request.user;
  });

  app.patch('/api/auth/me', async (request, reply) => {
    if (!request.user) return reply.code(401).send({ error: 'auth_required', message: 'Authentication required' });
    const blocked = new Set(['id', 'email', 'role', 'created_date', 'created_by_id']);
    const changes = Object.fromEntries(
      Object.entries(request.body || {}).filter(([key]) => !blocked.has(key)),
    );
    return entity('User').update(request.user.id, changes);
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const token = tokenFromRequest(request);
    await revokeSession(await sessionIdFromToken(token));
    reply.clearCookie('session', { path: '/' });
    return { ok: true };
  });
}
