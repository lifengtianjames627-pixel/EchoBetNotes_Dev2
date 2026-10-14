import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EntityRepository } from '../entities/repository.js';

let database;
let albums;

beforeAll(async () => {
  database = new PGlite();
  const migration = await readFile(new URL('../db/migrations/001_initial.sql', import.meta.url), 'utf8');
  await database.exec(migration);
  albums = new EntityRepository('Album', database);
});

afterAll(async () => {
  await database.close();
});

describe('PostgreSQL entity repository', () => {
  it('creates, filters, updates, and deletes entity records', async () => {
    const first = await albums.create({ title: 'Blue Train', genre: 'jazz', click_count: 2 });
    await albums.create({ title: 'Kind of Blue', genre: 'jazz', click_count: 5 });
    await albums.create({ title: 'Discovery', genre: 'electronic', click_count: 8 });

    expect(first.id).toMatch(/^[a-f0-9]{24}$/);
    const jazz = await albums.list({ filter: { genre: 'jazz' }, sort: '-created_date', limit: 10 });
    expect(jazz).toHaveLength(2);

    const selected = await albums.list({ filter: { id: { $in: jazz.map((album) => album.id) } }, limit: 10 });
    expect(selected).toHaveLength(2);

    const updated = await albums.update(first.id, { click_count: 3 });
    expect(updated.click_count).toBe(3);
    expect(await albums.remove(first.id)).toBe(true);
    expect(await albums.find(first.id)).toBeNull();
  });
});
