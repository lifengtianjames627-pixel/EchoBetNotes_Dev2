import { functionRegistry } from './index.js';
import { HttpError } from '../entities/policies.js';
import { withApiErrors } from '../http/sendError.js';

const parseValue = (value) => {
  if (typeof value !== 'string') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

async function functionPayload(request) {
  if (!request.isMultipart()) return request.body || {};
  const payload = {};
  for await (const part of request.parts()) {
    if (part.type === 'file') {
      payload[part.fieldname] = {
        bytes: await part.toBuffer(),
        filename: part.filename,
        mimetype: part.mimetype,
      };
    } else {
      payload[part.fieldname] = parseValue(part.value);
    }
  }
  return payload;
}

export async function functionRoutes(app) {
  app.post('/api/functions/:name', withApiErrors(async (request, reply) => {
    const handler = functionRegistry[request.params.name];
    if (!handler) throw new HttpError(404, 'unknown_function', 'Unknown workflow');
    return handler({ user: request.user, request, reply }, await functionPayload(request));
  }));
}
