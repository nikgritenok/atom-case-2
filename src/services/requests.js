import {
  findRequestById,
  createRequest,
  updateRequest,
  removeRequest,
  listRequestsDB,
  countRequestsDB,
} from '../repositories/requests.js';
import { findEquipmentById } from '../repositories/equipment.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../errors/index.js';
import { config } from '../config/index.js';

const TRANSITIONS = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

export async function listRequests(query) {
  const { status, priority, equipmentId, from, to, search, sortBy, order } =
    query ?? {};
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 20;
  const offset = (page - 1) * limit;
  if (limit > config.maxLimit || offset > config.maxOffset) {
    throw new BadRequestError('Превышен лимит пагинации');
  }
  const filters = {
    status,
    priority,
    equipmentId,
    from,
    to,
    search,
    sortBy,
    order,
    limit,
    offset,
  };
  const [data, total] = await Promise.all([
    listRequestsDB(filters),
    countRequestsDB({ status, priority, equipmentId, from, to, search }),
  ]);
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
    throw new ConflictError(`Переход из ${current.status} в ${next} запрещен`);
  }
  return updateRequest(id, { status: next });
}

export async function removeRequestService(id) {
  const current = await findRequestById(id);
  if (!current) throw new NotFoundError('Заявка не найдена');
  await removeRequest(id);
}
