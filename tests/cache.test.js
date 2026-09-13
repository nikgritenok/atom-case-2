import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reportPath, loadCachedReport } from '../src/storage/cache.js';

describe('cache — пути и miss', () => {
  it('строит путь reports/{город}-{дата}.json', () => {
    const p = reportPath('Казань', '2026-09-13');
    assert.match(p, /Казань-2026-09-13\.json$/);
  });

  it('возвращает null если файла нет', async () => {
    const miss = await loadCachedReport('__NoSuchCity__12345__');
    assert.equal(miss, null);
  });
});
