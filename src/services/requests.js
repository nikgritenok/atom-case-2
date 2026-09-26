import {
  sequelize,
  MaintenanceRequest,
  RequestStatusHistory,
  Technician,
  RequestAssignee,
} from '../db/index.js';
import {
  findRequestById,
  updateRequest,
  removeRequest,
  listRequestsDB,
  countRequestsDB,
} from '../repositories/requests.js';
import { findEquipmentById } from '../repositories/equipment.js';
import { mapDbError } from '../db/errors.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  BadRequestError,
} from '../errors/index.js';
import { config } from '../config/index.js';

const TRANSITIONS = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

function toISO(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

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
  try {
    const created = await sequelize.transaction(async (t) => {
      const row = await MaintenanceRequest.create(
        {
          equipmentId: data.equipmentId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status ?? 'new',
          plannedAt: data.plannedAt,
          author: data.author,
        },
        { transaction: t }
      );
      await RequestStatusHistory.create(
        {
          requestId: row.id,
          fromStatus: null,
          toStatus: row.status,
          author: data.author ?? null,
          comment: null,
        },
        { transaction: t }
      );
      return row;
    });
    return await findRequestById(created.id);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function updateRequestService(id, patch) {
  const current = await findRequestById(id);
  if (!current) throw new NotFoundError('Заявка не найдена');
  const safe = { ...patch };
  delete safe.status;
  return updateRequest(id, safe);
}

export async function changeRequestStatus(id, next, { author, comment } = {}) {
  const current = await findRequestById(id);
  if (!current) throw new NotFoundError('Заявка не найдена');
  const allowed = TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(next)) {
    throw new ConflictError(`Переход из ${current.status} в ${next} запрещен`);
  }
  try {
    const updatedId = await sequelize.transaction(async (t) => {
      const row = await MaintenanceRequest.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!row) throw new NotFoundError('Заявка не найдена');
      const inner = TRANSITIONS[row.status] ?? [];
      if (!inner.includes(next)) {
        throw new ConflictError(`Переход из ${row.status} в ${next} запрещен`);
      }
      if (next === 'in_progress') {
        const count = await RequestAssignee.count({
          where: { requestId: id },
          transaction: t,
        });
        if (count === 0) {
          throw new ConflictError(
            'Нельзя начать работу: нет назначенных исполнителей'
          );
        }
      }
      const from = row.status;
      row.status = next;
      await row.save({ transaction: t });
      await RequestStatusHistory.create(
        {
          requestId: id,
          fromStatus: from,
          toStatus: next,
          author: author ?? null,
          comment: comment ?? null,
        },
        { transaction: t }
      );
      return row.id;
    });
    return await findRequestById(updatedId);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function removeRequestService(id) {
  const current = await findRequestById(id);
  if (!current) throw new NotFoundError('Заявка не найдена');
  await removeRequest(id);
}

export async function setAssignees(requestId, list) {
  const items = list ?? [];
  const request = await MaintenanceRequest.findByPk(requestId);
  if (!request) throw new NotFoundError('Заявка не найдена');
  for (const item of items) {
    const tech = await Technician.findByPk(item.technicianId);
    if (!tech) throw new NotFoundError('Специалист не найден');
  }
  const leads = items.filter((item) => item.role === 'lead').length;
  if (items.length > 0 && leads !== 1) {
    throw new ValidationError(
      'В бригаде должен быть ровно один ведущий специалист'
    );
  }
  try {
    await sequelize.transaction(async (t) => {
      await RequestAssignee.destroy({ where: { requestId }, transaction: t });
      if (items.length > 0) {
        await RequestAssignee.bulkCreate(
          items.map((item) => ({
            requestId,
            technicianId: item.technicianId,
            role: item.role,
            hours: item.hours ?? 0,
          })),
          { transaction: t }
        );
      }
    });
    return await findRequestById(requestId);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function removeAssignee(requestId, technicianId) {
  try {
    const count = await RequestAssignee.destroy({
      where: { requestId, technicianId },
    });
    if (count === 0) throw new NotFoundError('Назначение не найдено');
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function getHistory(requestId) {
  const request = await MaintenanceRequest.findByPk(requestId);
  if (!request) throw new NotFoundError('Заявка не найдена');
  try {
    const rows = await RequestStatusHistory.findAll({
      where: { requestId },
      order: [['createdAt', 'ASC']],
    });
    return rows.map((row) => {
      const plain =
        typeof row.get === 'function' ? row.get({ plain: true }) : row;
      return {
        id: plain.id,
        fromStatus: plain.fromStatus ?? null,
        toStatus: plain.toStatus,
        author: plain.author ?? null,
        comment: plain.comment ?? null,
        createdAt: toISO(plain.createdAt),
      };
    });
  } catch (err) {
    throw mapDbError(err);
  }
}
