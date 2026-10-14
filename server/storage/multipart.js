import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';
import { putObject } from './objectStorage.js';

const directoryFor = (sessionId) => path.resolve(config.uploadDirectory, '.multipart', sessionId);

export async function writePart(sessionId, partNumber, bytes) {
  const directory = directoryFor(sessionId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, String(partNumber)), bytes);
}

export async function completeParts(sessionId, partCount, destination, contentType) {
  const chunks = [];
  for (let part = 1; part <= partCount; part += 1) {
    chunks.push(await readFile(path.join(directoryFor(sessionId), String(part))));
  }
  await putObject(destination, Buffer.concat(chunks), contentType);
  await rm(directoryFor(sessionId), { recursive: true, force: true });
}

export async function abortParts(sessionId) {
  await rm(directoryFor(sessionId), { recursive: true, force: true });
}
