import path from 'node:path';
import { HttpError } from '../entities/policies.js';
import {
  publicObjectUrl,
  putObject,
  readLocalObject,
  storageKey,
  verifyLocalSignature,
} from './objectStorage.js';
import { config } from '../config/env.js';

const extensionFor = (mime) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
}[mime] || 'bin');

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
    const key = storageKey('public', extensionFor(file.mimetype));
    await putObject(key, file.bytes, file.mimetype);
    return { file_url: publicObjectUrl(key) };
  });

  app.get('/api/media/public/*', async (request, reply) => {
    if (config.storageDriver !== 'local') throw new HttpError(404, 'not_found');
    const key = `public/${decodeURIComponent(request.params['*'])}`;
    const bytes = await readLocalObject(key);
    reply.type(path.extname(key));
    return reply.send(bytes);
  });

  app.get('/api/media/*', async (request, reply) => {
    if (config.storageDriver !== 'local') throw new HttpError(404, 'not_found');
    const key = decodeURIComponent(request.params['*']);
    if (!verifyLocalSignature(key, request.query.expires, request.query.signature)) {
      throw new HttpError(403, 'invalid_signature');
    }
    reply.header('Cache-Control', 'private, no-store');
    reply.type(path.extname(key));
    return reply.send(await readLocalObject(key));
  });
}
