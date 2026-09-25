import { Op } from 'sequelize';
import { MaintenanceRequest, Technician, SparePart } from '../db/index.js';
import { mapDbError } from '../db/errors.js';

const SORTABLE = ['createdAt', 'updatedAt', 'plannedAt', 'priority'];

const REQUEST_ATTRIBUTES = [
  'id',
  'equipmentId',
  'title',
  'description',
  'priority',
  'status',
  'plannedAt',
  'author',
  'createdAt',
  'updatedAt',
];

function requestInclude() {
  return [
    {
      model: Technician,
      attributes: ['id', 'fullName', 'spec', 'tabNumber'],
      through: { attributes: ['role', 'hours'] },
    },
    {
      model: SparePart,
      attributes: ['id', 'name', 'sku'],
      through: { attributes: ['qty'] },
    },
  ];
}

function toISO(value) {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function toRequestJSON(row) {
  if (!row) return null;
  const plain = typeof row.get === 'function' ? row.get({ plain: true }) : row;
  const technicians = plain.Technicians ?? plain.technicians ?? [];
  const spareParts = plain.SpareParts ?? plain.spareParts ?? [];
  return {
    id: plain.id,
    equipmentId: plain.equipmentId,
    title: plain.title,
    description: plain.description,
    priority: plain.priority,
    status: plain.status,
    plannedAt: toISO(plain.plannedAt),
    author: plain.author ?? null,
    createdAt: toISO(plain.createdAt),
    updatedAt: toISO(plain.updatedAt),
    assignees: technicians.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      spec: t.spec,
      tabNumber: t.tabNumber,
      role: t.RequestAssignee?.role ?? t.requestAssignee?.role ?? null,
      hours: Number(t.RequestAssignee?.hours ?? t.requestAssignee?.hours ?? 0),
    })),
    parts: spareParts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      qty: Number(p.RequestSparePart?.qty ?? p.requestSparePart?.qty ?? 0),
    })),
  };
}

function buildWhere({ status, priority, equipmentId, from, to, search }) {
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (equipmentId) where.equipmentId = equipmentId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = from;
    if (to) where.createdAt[Op.lte] = to;
  }
  if (search) {
    const needle = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.iLike]: needle } },
      { description: { [Op.iLike]: needle } },
    ];
  }
  return where;
}

function buildOrder(sortBy, order) {
  const field = SORTABLE.includes(sortBy) ? sortBy : 'createdAt';
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  return [[field, direction]];
}

export async function listRequestsDB({
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
} = {}) {
  try {
    const rows = await MaintenanceRequest.findAll({
      attributes: REQUEST_ATTRIBUTES,
      where: buildWhere({ status, priority, equipmentId, from, to, search }),
      include: requestInclude(),
      order: buildOrder(sortBy, order),
      limit,
      offset,
    });
    return rows.map(toRequestJSON);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function countRequestsDB({
  status,
  priority,
  equipmentId,
  from,
  to,
  search,
} = {}) {
  try {
    return await MaintenanceRequest.count({
      where: buildWhere({ status, priority, equipmentId, from, to, search }),
    });
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function findAllRequests() {
  try {
    const rows = await MaintenanceRequest.findAll({
      attributes: REQUEST_ATTRIBUTES,
      include: requestInclude(),
      order: [['createdAt', 'DESC']],
    });
    return rows.map(toRequestJSON);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function findRequestById(id) {
  try {
    const row = await MaintenanceRequest.findByPk(id, {
      attributes: REQUEST_ATTRIBUTES,
      include: requestInclude(),
    });
    return row ? toRequestJSON(row) : null;
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function findRequestsByEquipment(equipmentId) {
  try {
    const rows = await MaintenanceRequest.findAll({
      attributes: REQUEST_ATTRIBUTES,
      where: { equipmentId },
      include: requestInclude(),
      order: [['createdAt', 'DESC']],
    });
    return rows.map(toRequestJSON);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function findOpenRequestsByEquipment(equipmentId) {
  try {
    const rows = await MaintenanceRequest.findAll({
      attributes: REQUEST_ATTRIBUTES,
      where: { equipmentId, status: { [Op.in]: ['new', 'in_progress'] } },
      include: requestInclude(),
      order: [['createdAt', 'DESC']],
    });
    return rows.map(toRequestJSON);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function createRequest(data) {
  try {
    const created = await MaintenanceRequest.create({
      equipmentId: data.equipmentId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status ?? 'new',
      plannedAt: data.plannedAt,
      author: data.author,
    });
    return await findRequestById(created.id);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function updateRequest(id, patch) {
  try {
    const row = await MaintenanceRequest.findByPk(id);
    if (!row) return null;
    row.set(patch);
    await row.save();
    return await findRequestById(id);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function removeRequest(id) {
  try {
    const row = await MaintenanceRequest.findByPk(id);
    if (!row) return false;
    await row.destroy();
    return true;
  } catch (err) {
    throw mapDbError(err);
  }
}
