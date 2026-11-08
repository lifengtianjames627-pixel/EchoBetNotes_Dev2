import path from 'node:path';
import { HttpError } from '../entities/policies.js';
import {
  publicObjectUrl,
  putObject,
  readLocalObject,
  safeKey,
  storageKey,
  verifyLocalSignature,
} from './objectStorage.js';
import { config } from '../config/env.js';

const publicTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const contentTypes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

const contentTypeFor = (key) => contentTypes[path.extname(key).slice(1).toLowerCase()] || 'application/octet-stream';

export async function uploadedFile(request, fieldName = 'file') {
  if (!request.isMultipart()) return null;
  const part = await request.file({ limits: { fileSize: 50 * 1024 * 1024 } });
  if (!part || part.fieldname !== fieldName) return null;
  const bytes = await part.toBuffer();
  return { bytes, filename: part.filename, mimetype: part.mimetype };
}

export async function storageRoutes(app) {
  app.post('/api/uploads/public', async (request) => {
    if (!request.user) throw new HttpError(401, 'auth_required');
    const file = await uploadedFile(request);
    if (!file?.bytes.length) throw new HttpError(400, 'invalid_file');
    if (file.bytes.length > 10 * 1024 * 1024) throw new HttpError(413, 'file_too_large');
    const extension = publicTypes[file.mimetype];
    if (!extension) throw new HttpError(415, 'unsupported_media');
    const key = storageKey('public', extension);
    await putObject(key, file.bytes, file.mimetype);
    return { file_url: publicObjectUrl(key) };
  });

  app.get('/api/media/public/*', async (request, reply) => {
    if (config.storageDriver !== 'local') throw new HttpError(404, 'not_found');
    let key;
    try {
      key = safeKey(`public/${decodeURIComponent(request.params['*'])}`);
    } catch {
      throw new HttpError(404, 'not_found');
    }
    if (!key.startsWith('public/')) throw new HttpError(404, 'not_found');
    const bytes = await readLocalObject(key).catch(() => {
      throw new HttpError(404, 'not_found');
    });
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Content-Disposition', contentTypeFor(key) === 'application/pdf' ? 'attachment' : 'inline');
    reply.type(contentTypeFor(key));
    return reply.send(bytes);
  });

  app.get('/api/media/*', async (request, reply) => {
    if (config.storageDriver !== 'local') throw new HttpError(404, 'not_found');
    let key;
    try {
      key = safeKey(decodeURIComponent(request.params['*']));
    } catch {
      throw new HttpError(403, 'invalid_signature');
    }
    if (!verifyLocalSignature(key, request.query.expires, request.query.signature)) {
      throw new HttpError(403, 'invalid_signature');
    }
    const bytes = await readLocalObject(key).catch(() => {
      throw new HttpError(404, 'not_found');
    });
    reply.header('Cache-Control', 'private, no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.type(contentTypeFor(key));
    return reply.send(bytes);
  });
}
