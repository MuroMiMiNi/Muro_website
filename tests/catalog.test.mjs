import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, unlink, rm } from 'node:fs/promises';
import path from 'node:path';
import { root, filenameDate, createCatalog } from '../scripts/sync-artworks.mjs';

test('filename dates support dashed and compact formats and reject impossible dates', () => {
  assert.equal(filenameDate('2026-10-04 Muro.png'), '2026-10-04');
  assert.equal(filenameDate('commission_20261003.png'), '2026-10-03');
  assert.equal(filenameDate('2024.02.29.png'), '2024-02-29');
  assert.equal(filenameDate('2026-02-29.png'), null);
  assert.equal(filenameDate('Commission01.png'), null);
});

test('folder scan adds and removes works, recurses, and sorts dates before legacy order', async () => {
  const base = path.join(root, '.test-results');
  await mkdir(base, { recursive: true });
  const folder = await mkdtemp(path.join(base, 'catalog-'));
  try {
    await mkdir(path.join(folder, 'characters'));
    for (const file of ['Bernard 貝爾納.png', 'Antia 安緹婭.png', '2025-01-01 older.png', 'characters/2026-10-04 newer.webp', 'notes.txt']) await writeFile(path.join(folder, file), 'fixture');
    const first = await createCatalog(folder);
    assert.deepEqual(first.map(item => item.id), ['characters/2026-10-04 newer.webp', '2025-01-01 older.png', 'Antia 安緹婭.png', 'Bernard 貝爾納.png']);
    assert.equal(first[0].category, 'characters');
    assert.equal(first[0].title.zh, 'newer');
    await writeFile(path.join(folder, '2026-10-05 newest.png'), 'fixture');
    assert.equal((await createCatalog(folder))[0].title.zh, 'newest');
    await unlink(path.join(folder, 'Antia 安緹婭.png'));
    const next = await createCatalog(folder);
    assert.equal(next.length, 4);
    assert.ok(next.every(item => item.id !== 'Antia 安緹婭.png'));
  } finally {
    if (path.dirname(folder) !== base || !path.basename(folder).startsWith('catalog-')) throw new Error('Unsafe test path');
    await rm(folder, { recursive: true, force: true });
  }
});
