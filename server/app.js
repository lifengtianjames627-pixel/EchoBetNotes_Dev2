import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import Fastify from 'fastify';
import { config } from './config/env.js';
import { pool } from './db/pool.js';
import { authRoutes } from './auth/routes.js';
import { resolveSession, tokenFromRequest } from './auth/session.js';
import { entityRoutes } from './entities/routes.js';
import { functionRoutes } from './functions/routes.js';
import { storageRoutes } from './storage/routes.js';
import { actorRoleFromRequest, logApiRequest } from './http/log.js';
import { readOrCreateRequestId } from './http/requestId.js';
import { sendApiError } from './http/sendError.js';

export async function buildApp(options = {}) {
  const app = Fastify({
    logger: options.logger ?? { level: config.production ? 'info' : 'warn' },
    trustProxy: true,
    bodyLimit: 55 * 1024 * 1024,
  });

  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024, files: 2, fields: 100 },
  });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Origin is not allowed'), false);
    },
    credentials: true,
  });

  app.decorateRequest('user', null);
  app.decorateRequest('requestId', null);
  app.decorateRequest('requestStartedAt', null);

  app.addHook('onRequest', async (request, reply) => {
    request.requestId = readOrCreateRequestId(request.headers['x-request-id']);
    request.requestStartedAt = Date.now();
    reply.header('x-request-id', request.requestId);
    reply.header('Cache-Control', 'no-store');
  });

  app.addHook('preHandler', async (request) => {
    request.user = await resolveSession(tokenFromRequest(request));
  });

  app.addHook('onResponse', async (request, reply) => {
    if (!request.url.startsWith('/api/') && request.url !== '/health') return;
    const errorPayload = reply.getHeader('x-error-code');
    logApiRequest(request.log, {
      requestId: request.requestId,
      route: request.url,
      method: request.method,
      status: reply.statusCode,
      durationMs: Date.now() - (request.requestStartedAt || Date.now()),
      actorRole: actorRoleFromRequest(request),
      errorCode: typeof errorPayload === 'string' ? errorPayload : null,
    });
  });

  const health = async (_request, reply) => {
    try {
      await pool.query('SELECT 1');
      return { status: 'ok', checks: { database: 'ok' } };
    } catch {
      return reply.code(503).send({ status: 'degraded', checks: { database: 'error' } });
    }
  };
  app.get('/health', health);
  app.get('/api/health', health);
  app.get('/api/apps/public/prod/public-settings/by-id/:appId', async (request) => ({
    id: request.params.appId,
    public_settings: { name: 'Echoes Between Notes', authentication_required: false },
  }));

  await authRoutes(app);
  await entityRoutes(app);
  await functionRoutes(app);
  await storageRoutes(app);

  const dist = path.resolve('dist');
  let hasDist = false;
  try {
    await access(path.join(dist, 'index.html'));
    hasDist = true;
  } catch {
    hasDist = false;
  }
  if (hasDist) {
    await app.register(staticFiles, { root: dist, wildcard: false });
  }

  const apiErrorBody = (request, code, message) => ({
    error: code,
    message,
    requestId: request.requestId,
  });

  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api/') || request.url === '/health') {
      reply.header('x-error-code', 'not_found');
      return reply.code(404).send(apiErrorBody(request, 'not_found', 'Route not found'));
    }
    if (hasDist && request.method === 'GET') {
      reply.type('text/html');
      return reply.send(await readFile(path.join(dist, 'index.html')));
    }
    return reply.code(404).send({ error: 'not_found' });
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, request_id: request.requestId }, 'request failed');
    return sendApiError(reply, request, error);
  });

  return app;
}
