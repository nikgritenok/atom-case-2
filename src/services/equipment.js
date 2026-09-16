import {
  findAllEquipment,
  findEquipmentById,
  findEquipmentBySerial,
  createEquipment,
  updateEquipment,
  removeEquipment,
} from '../repositories/equipment.js';
import { findOpenRequestsByEquipment } from '../repositories/requests.js';
import {
  NotFoundError,
  ConflictError,
} from '../errors/index.js';

const ALLOWED_SORT = ['name', 'installedAt', 'createdAt'];

export async function listEquipment(query) {
  const all = await findAllEquipment();
  let items = [...all];

  if (query.type) items = items.filter((e) => e.type === query.type);
  if (query.status) items = items.filter((e) => e.status === query.status);

  const sortBy = ALLOWED_SORT.includes(query.sortBy)
    ? query.sortBy
    : 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return -1 * order;
    if (a[sortBy] > b[sortBy]) return 1 * order;
    return 0;
  });

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = items.length;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

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
  if (
    patch.serialNumber &&
    patch.serialNumber !== current.serialNumber
  ) {
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
