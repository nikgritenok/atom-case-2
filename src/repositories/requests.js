import { randomUUID } from 'node:crypto';
import { loadDb, saveDb } from './store.js';

export async function findAllRequests() {
  const db = await loadDb();
  return db.requests;
}

export async function findRequestById(id) {
  const db = await loadDb();
  return db.requests.find((r) => r.id === id) ?? null;
}

export async function findRequestsByEquipment(equipmentId) {
  const db = await loadDb();
  return db.requests.filter((r) => r.equipmentId === equipmentId);
}

export async function createRequest(data) {
  const db = await loadDb();
  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    status: 'new',
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  db.requests.push(item);
  await saveDb();
  return item;
}

export async function updateRequest(id, patch) {
  const db = await loadDb();
  const item = db.requests.find((r) => r.id === id);
  if (!item) return null;
  Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  await saveDb();
  return item;
}

export async function removeRequest(id) {
  const db = await loadDb();
  const idx = db.requests.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  db.requests.splice(idx, 1);
  await saveDb();
  return true;
}
