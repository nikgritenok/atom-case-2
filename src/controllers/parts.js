import * as partsService from '../services/parts.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const setParts = asyncHandler(async (req, res) => {
  const data = await partsService.setParts(req.params.id, req.body.parts);
  res.json({ data });
});

export const getParts = asyncHandler(async (req, res) => {
  const data = await partsService.getParts(req.params.id);
  res.json({ data });
});

export const removePart = asyncHandler(async (req, res) => {
  await partsService.removePart(req.params.id, req.params.partId);
  res.status(204).end();
});
