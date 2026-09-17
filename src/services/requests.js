import {
  findAllRequests,
  findRequestById,
  createRequest,
  updateRequest,
  removeRequest,
} from '../repositories/requests.js';
import { findEquipmentById } from '../repositories/equipment.js';
import {
  NotFoundError,
  ConflictError,
} from '../errors/index.js';

const TRANSITIONS = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

const SORTABLE = ['createdAt', 'updatedAt', 'plannedAt', 'priority'];

export async function listRequests(query) {
  const all = await findAllRequests();
  let items = [...all];

  if (query.status) items = items.filter((r) => r.status === query.status);
  if (query.priority) {
    items = items.filter((r) => r.priority === query.priority);
  }
  if (query.equipmentId) {
    items = items.filter((r) => r.equipmentId === query.equipmentId);
  }
  if (query.from) {
    items = items.filter((r) => r.createdAt >= query.from);
  }
  if (query.to) {
    items = items.filter((r) => r.createdAt <= query.to);
  }

  const sortBy = SORTABLE.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    if (av < bv) return -1 * order;
    if (av > bv) return 1 * order;
    return 0;
  });

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = items.length;
  const data = items.slice((page - 1) * limit, page * limit);

  return { data, meta: { total, page, limit } };
}

export async function getRequest(id) {
  const item = await findRequestById(id);
  if (!item) throw new NotFoundError('Заявка не найдена');
  return item;
}

export async function createRequestService(data) {
  const equipment = await findEquipmentById(data.equipmentId);
  if (!equipment) throw new NotFoundError('Оборудование не найдено');
  return createRequest(data);
}

export async function updateRequestService(id, patch) {
  const current = await findRequestById(id);
  if (!current) throw new NotFoundError('Заявка не найдена');
  const safe = { ...patch };
  delete safe.status;
  return updateRequest(id, safe);
}

export async function changeRequestStatus(id, next) {
  const current = await findRequestById(id);
  if (!current) throw new NotFoundError('Заявка не найдена');
  const allowed = TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(next)) {
    throw new ConflictError(
      `Переход из ${current.status} в ${next} запрещен`
    );
  }
  return updateRequest(id, { status: next });
}

export async function removeRequestService(id) {
  const current = await findRequestById(id);
  if (!current) throw new NotFoundError('Заявка не найдена');
  await removeRequest(id);
}
