import { definitions } from './definitions/index.js';
import { entity } from './repository.js';
import {
  HttpError,
  assertEntityOperation,
  canReadRecord,
  prepareEntityInput,
} from './policies.js';
import { withApiErrors } from '../http/sendError.js';

const decodeCursor = (cursor) => {
  if (!cursor) return 0;
  try {
    return Math.max(0, Number(Buffer.from(cursor, 'base64url').toString('utf8')) || 0);
  } catch {
    return 0;
  }
};

const encodeCursor = (offset) => Buffer.from(String(offset)).toString('base64url');
const requireDefinition = (name) => {
  if (!definitions[name]) throw new HttpError(404, 'unknown_entity', 'Unknown entity');
  return definitions[name];
};

const visibleRecords = (name, actor, records) =>
  records.filter((record) => canReadRecord(name, actor, record));

export async function entityRoutes(app) {
  app.get('/api/entities/:name', withApiErrors(async (request) => {
    const { name } = request.params;
    requireDefinition(name);
    if (definitions[name].policy.read === 'admin' && request.user?.role !== 'admin') {
      throw new HttpError(request.user ? 403 : 401, 'forbidden');
    }
    const records = await entity(name).list({
      sort: request.query.sort,
      limit: request.query.limit,
      offset: decodeCursor(request.query.cursor),
    });
    return visibleRecords(name, request.user, records);
  }));

  app.post('/api/entities/:name/filter', withApiErrors(async (request) => {
    const { name } = request.params;
    requireDefinition(name);
    if (definitions[name].policy.read === 'admin' && request.user?.role !== 'admin') {
      throw new HttpError(request.user ? 403 : 401, 'forbidden');
    }
    const body = request.body || {};
    const paged = Object.hasOwn(body, 'cursor');
    const offset = paged ? decodeCursor(body.cursor) : Number(body.offset || 0);
    const limit = Math.min(Number(body.limit || 100), 1000);
    const records = visibleRecords(name, request.user, await entity(name).list({
      filter: body.filter || {},
      sort: body.sort,
      limit: limit + (paged ? 1 : 0),
      offset,
    }));
    if (!paged) return records.slice(0, limit);
    const hasMore = records.length > limit;
    return {
      items: records.slice(0, limit),
      has_more: hasMore,
      next_cursor: hasMore ? encodeCursor(offset + limit) : undefined,
    };
  }));

  app.post('/api/entities/:name', withApiErrors(async (request) => {
    const { name } = request.params;
    requireDefinition(name);
    const input = prepareEntityInput(name, request.user, request.body || {});
    assertEntityOperation(name, 'create', request.user, null, input);
    return entity(name).create(input, request.user);
  }));

  app.patch('/api/entities/:name/:id', withApiErrors(async (request) => {
    const { name, id } = request.params;
    requireDefinition(name);
    const current = await entity(name).find(id);
    if (!current) throw new HttpError(404, 'not_found', 'Record not found');
    assertEntityOperation(name, 'update', request.user, current, request.body || {});
    const changes = { ...(request.body || {}) };
    if (name === 'User') {
      delete changes.role;
      delete changes.email;
    }
    return entity(name).update(id, changes);
  }));

  app.delete('/api/entities/:name/:id', withApiErrors(async (request) => {
    const { name, id } = request.params;
    requireDefinition(name);
    const current = await entity(name).find(id);
    if (!current) throw new HttpError(404, 'not_found', 'Record not found');
    assertEntityOperation(name, 'delete', request.user, current);
    await entity(name).remove(id);
    return { ok: true };
  }));

  app.post('/api/entities/:name/aggregate', withApiErrors(async (request) => {
    const { name } = request.params;
    requireDefinition(name);
    const records = visibleRecords(name, request.user, await entity(name).list({ limit: 1000 }));
    const { groupBy, sum } = request.body || {};
    if (!groupBy) throw new HttpError(400, 'invalid_aggregate');
    const grouped = new Map();
    for (const record of records) {
      const key = record[groupBy] ?? null;
      const current = grouped.get(key) || { [groupBy]: key, count: 0, [`sum_${sum}`]: 0 };
      current.count += 1;
      if (sum) current[`sum_${sum}`] += Number(record[sum] || 0);
      grouped.set(key, current);
    }
    return { rows: [...grouped.values()] };
  }));
}
