import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { config } from '../config/index.js';

let cache = null;

export async function loadDb() {
  if (cache) return cache;
  try {
    const raw = await readFile(config.dbPath, 'utf8');
    cache = JSON.parse(raw);
    cache.equipment ??= [];
    cache.requests ??= [];
    return cache;
  } catch {
    cache = { equipment: [], requests: [] };
    return cache;
  }
}

export async function saveDb() {
  await mkdir(dirname(config.dbPath), { recursive: true });
  await writeFile(config.dbPath, JSON.stringify(cache, null, 2));
}

export function resetCache() {
  cache = null;
}
