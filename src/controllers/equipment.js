import {
  listEquipment,
  getEquipment,
  createEquipmentService,
  updateEquipmentService,
  removeEquipmentService,
} from '../services/equipment.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const result = await listEquipment(req.query);
  res.json(result);
});

export const getOne = asyncHandler(async (req, res) => {
  const item = await getEquipment(req.params.id);
  res.json({ data: item });
});

export const create = asyncHandler(async (req, res) => {
  const item = await createEquipmentService(req.body);
  res.status(201).set('Location', `/api/equipment/${item.id}`).json({
    data: item,
  });
});

export const update = asyncHandler(async (req, res) => {
  const item = await updateEquipmentService(req.params.id, req.body);
  res.json({ data: item });
});

export const remove = asyncHandler(async (req, res) => {
  await removeEquipmentService(req.params.id);
  res.status(204).end();
});
