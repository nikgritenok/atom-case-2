import { getSiteSummary } from '../services/sites.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const getSummary = asyncHandler(async (req, res) => {
  const data = await getSiteSummary(req.params.id);
  res.json({ data });
});
