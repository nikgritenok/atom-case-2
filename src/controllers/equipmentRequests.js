import { loadDb } from '../repositories/store.js';
import { getEquipment } from '../services/equipment.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const byEquipment = asyncHandler(async (req, res) => {
  await getEquipment(req.params.id);
  const db = await loadDb();
  const items = db.requests.filter((r) => r.equipmentId === req.params.id);
  res.json({
    data: items,
    meta: { total: items.length, page: 1, limit: items.length || 20 },
  });
});
