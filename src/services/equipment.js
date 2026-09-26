import {
  findEquipmentById,
  findEquipmentBySerial,
  createEquipment,
  updateEquipment,
  removeEquipment,
  listEquipmentDB,
  countEquipmentDB,
} from '../repositories/equipment.js';
import { findOpenRequestsByEquipment } from '../repositories/requests.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../errors/index.js';
import { config } from '../config/index.js';

export async function listEquipment(query) {
  const { type, status, search, sortBy, order } = query ?? {};
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 20;
  const offset = (page - 1) * limit;
  if (limit > config.maxLimit || offset > config.maxOffset) {
    throw new BadRequestError('Превышен лимит пагинации');
  }
  const filters = { type, status, search, sortBy, order, limit, offset };
  const [data, total] = await Promise.all([
    listEquipmentDB(filters),
    countEquipmentDB({ type, status, search }),
  ]);
  return { data, meta: { total, page, limit } };
}

export async function getEquipment(id) {
  const item = await findEquipmentById(id);
  if (!item) throw new NotFoundError('Оборудование не найдено');
  return item;
}

export async function createEquipmentService(data) {
  const busy = await findEquipmentBySerial(data.serialNumber);
  if (busy) throw new ConflictError('Серийный номер уже занят');
  return createEquipment(data);
}

export async function updateEquipmentService(id, patch) {
  const current = await findEquipmentById(id);
  if (!current) throw new NotFoundError('Оборудование не найдено');
  if (patch.serialNumber && patch.serialNumber !== current.serialNumber) {
    const busy = await findEquipmentBySerial(patch.serialNumber);
    if (busy) throw new ConflictError('Серийный номер уже занят');
  }
  return updateEquipment(id, patch);
}

export async function removeEquipmentService(id) {
  const current = await findEquipmentById(id);
  if (!current) throw new NotFoundError('Оборудование не найдено');
  const open = await findOpenRequestsByEquipment(id);
  if (open.length > 0) {
    throw new ConflictError('Есть открытые заявки по оборудованию');
  }
  await removeEquipment(id);
}
