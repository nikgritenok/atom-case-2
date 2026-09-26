import { findRequestsByEquipment } from '../repositories/requests.js';
import { getEquipment } from '../services/equipment.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const byEquipment = asyncHandler(async (req, res) => {
  await getEquipment(req.params.id);
  const items = await findRequestsByEquipment(req.params.id);
  res.json({
    data: items,
    meta: { total: items.length, page: 1, limit: items.length || 20 },
  });
});
