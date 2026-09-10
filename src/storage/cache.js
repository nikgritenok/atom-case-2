import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function safeFileName(city) {
  return city
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .slice(0, 100);
}

export function reportPath(city, date = todayStr()) {
  return path.join(config.reportsDir, `${safeFileName(city)}-${date}.json`);
}

export async function loadCachedReport(city) {
  const file = reportPath(city);
  try {
    const raw = await readFile(file, 'utf-8');
    const data = JSON.parse(raw);
    return { ...data, source: 'cache' };
  } catch {
    return null;
  }
}

export async function saveReport(report) {
  const file = reportPath(report.requestedCity);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(report, null, 2), 'utf-8');
  return file;
}
