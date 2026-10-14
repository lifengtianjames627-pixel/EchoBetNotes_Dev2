import { createHmac, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';

const s3 = config.storageDriver === 's3'
  ? new S3Client({
      endpoint: config.s3.endpoint || undefined,
      region: config.s3.region,
      forcePathStyle: config.s3.forcePathStyle,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    })
  : null;

const safeKey = (key) => {
  const normalized = path.posix.normalize(String(key || '')).replace(/^(\.\.\/)+/, '');
  if (!normalized || normalized.startsWith('/') || normalized.includes('..')) throw new Error('Invalid storage key');
  return normalized;
};

export const storageKey = (scope, extension = 'bin') =>
  `${scope}/${randomUUID()}.${String(extension).replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin'}`;

export async function putObject(key, bytes, contentType = 'application/octet-stream') {
  const normalized = safeKey(key);
  if (s3) {
    await s3.send(new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: normalized,
      Body: bytes,
      ContentType: contentType,
    }));
    return;
  }
  const target = path.resolve(config.uploadDirectory, normalized);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

export async function readLocalObject(key) {
  return readFile(path.resolve(config.uploadDirectory, safeKey(key)));
}

export async function signedObjectUrl(key, expiresIn = 300) {
  const normalized = safeKey(key);
  if (s3) {
    return getSignedUrl(s3, new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: normalized,
    }), { expiresIn });
  }
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const signature = createHmac('sha256', config.jwtSecret)
    .update(`${normalized}:${expires}`)
    .digest('hex');
  const base = config.publicBaseUrl.replace(/\/$/, '');
  return `${base}/api/media/${encodeURIComponent(normalized)}?expires=${expires}&signature=${signature}`;
}

export function verifyLocalSignature(key, expires, signature) {
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', config.jwtSecret)
    .update(`${safeKey(key)}:${expires}`)
    .digest('hex');
  if (expected.length !== String(signature || '').length) return false;
  return expected === signature;
}

export const publicObjectUrl = (key) => {
  const base = config.publicBaseUrl.replace(/\/$/, '');
  const normalized = safeKey(key);
  const publicKey = normalized.startsWith('public/') ? normalized.slice('public/'.length) : normalized;
  return `${base}/api/media/public/${encodeURIComponent(publicKey)}`;
};
