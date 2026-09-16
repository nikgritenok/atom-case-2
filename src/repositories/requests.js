import { loadDb } from './store.js';

export async function findOpenRequestsByEquipment(equipmentId) {
  const db = await loadDb();
  return db.requests.filter(
    (r) =>
      r.equipmentId === equipmentId &&
      (r.status === 'new' || r.status === 'in_progress')
  );
}
