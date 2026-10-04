import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../scripts/hanging-mobile.js';

test('calendar months determine branches, with newest periods and works first', () => {
  const result = buildTimeline([
    { id: 'undated-a', date: null },
    { id: 'september', date: '2026-09-30' },
    { id: 'october-early', date: '2026-10-01' },
    { id: 'last-year', date: '2025-12-31' },
    { id: 'october-new', date: '2026-10-04' },
    { id: 'undated-b', date: null }
  ]);
  assert.deepEqual(result.map(period => period.key), ['2026-10', '2026-09', '2025-12', 'undated']);
  assert.deepEqual(result.map(period => period.year), ['2026', '2026', '2025', null]);
  assert.deepEqual(result[0].works.map(work => work.id), ['october-new', 'october-early']);
  assert.deepEqual(result[3].works.map(work => work.id), ['undated-a', 'undated-b']);
});

test('adding works to the same month does not split it at any fixed count', () => {
  for (const count of [1, 8, 9, 16, 17, 33]) {
    const works = Array.from({ length: count }, (_, id) => ({ id, date: '2026-10-04' }));
    const result = buildTimeline(works);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].works, works);
  }
});

test('undated works keep their existing order without invented dates or count-based branches', () => {
  const works = Array.from({ length: 16 }, (_, i) => ({ id: `legacy-${15 - i}`, date: null }));
  const result = buildTimeline(works);
  assert.equal(result.length, 1);
  assert.equal(result[0].key, 'undated');
  assert.deepEqual(result[0].works, works);
  assert.deepEqual(buildTimeline([]), []);
});
