import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { EntityRepository } from '../../entities/repository.js';
import { createTestDatabase } from './setup.js';

let testDb;
let albums;

before(async () => {
  testDb = await createTestDatabase();
  albums = new EntityRepository('Album', testDb.database);
});

after(async () => {
  await testDb.close();
});

describe('PostgreSQL entity repository', () => {
  it('creates, filters, updates, and deletes entity records', async () => {
    const first = await albums.create({ title: 'Blue Train', genre: 'jazz', click_count: 2 });
    await albums.create({ title: 'Kind of Blue', genre: 'jazz', click_count: 5 });
    await albums.create({ title: 'Discovery', genre: 'electronic', click_count: 8 });

    assert.match(first.id, /^[a-f0-9]{24}$/);
    const jazz = await albums.list({ filter: { genre: 'jazz' }, sort: '-created_date', limit: 10 });
    assert.equal(jazz.length, 2);

    const selected = await albums.list({ filter: { id: { $in: jazz.map((album) => album.id) } }, limit: 10 });
    assert.equal(selected.length, 2);

    const updated = await albums.update(first.id, { click_count: 3 });
    assert.equal(updated.click_count, 3);
    assert.equal(await albums.remove(first.id), true);
    assert.equal(await albums.find(first.id), null);
  });

  it('reads only the rows whose participant list contains the member', async () => {
    const messages = new EntityRepository('ChatMessage', testDb.database);
    await messages.create({ participants: ['a@example.com', 'b@example.com'], content: 'ours' });
    await messages.create({ participants: ['c@example.com', 'd@example.com'], content: 'theirs' });
    const mine = await messages.listArrayIncludes('participants', 'b@example.com', { limit: 10 });
    assert.deepEqual(mine.map((message) => message.content), ['ours']);
  });
});
