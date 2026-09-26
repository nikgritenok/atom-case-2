import { getEquipmentLoad } from '../services/reports.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const getLoad = asyncHandler(async (req, res) => {
  const { data, meta } = await getEquipmentLoad(req.query);
  res.json({ data, meta });
});
