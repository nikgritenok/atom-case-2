import { randomUUID } from 'node:crypto';
import { loadDb, saveDb } from './store.js';

export async function findAllEquipment() {
  const db = await loadDb();
  return db.equipment;
}

export async function findEquipmentById(id) {
  const db = await loadDb();
  return db.equipment.find((e) => e.id === id) ?? null;
}

export async function findEquipmentBySerial(serialNumber) {
  const db = await loadDb();
  return db.equipment.find((e) => e.serialNumber === serialNumber) ?? null;
}

export async function createEquipment(data) {
  const db = await loadDb();
  const now = new Date().toISOString();
  const item = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
  db.equipment.push(item);
  await saveDb();
  return item;
}

export async function updateEquipment(id, patch) {
  const db = await loadDb();
  const item = db.equipment.find((e) => e.id === id);
  if (!item) return null;
  Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  await saveDb();
  return item;
}

export async function removeEquipment(id) {
  const db = await loadDb();
  const idx = db.equipment.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  db.equipment.splice(idx, 1);
  await saveDb();
  return true;
}
