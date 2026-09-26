import { Op } from 'sequelize';
import { Equipment, EquipmentPassport } from '../db/index.js';
import { mapDbError } from '../db/errors.js';

const EQUIPMENT_ATTRIBUTES = [
  'id',
  'siteId',
  'name',
  'type',
  'serialNumber',
  'lat',
  'lon',
  'status',
  'installedAt',
  'createdAt',
  'updatedAt',
];

const PASSPORT_ATTRIBUTES = ['manufacturer', 'model', 'powerKw', 'lastCheckAt'];

const PASSPORT_INCLUDE = {
  model: EquipmentPassport,
  attributes: PASSPORT_ATTRIBUTES,
};

const SORT_MAP = {
  name: 'name',
  installedAt: 'installed_at',
  createdAt: 'created_at',
};

function toIso(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

export function toEquipmentJSON(m) {
  if (!m) {
    return null;
  }
  const plain = typeof m.get === 'function' ? m.get({ plain: true }) : m;
  const rawPassport =
    plain.EquipmentPassport ??
    plain.equipmentPassport ??
    plain.passport ??
    null;
  return {
    id: plain.id,
    name: plain.name,
    type: plain.type,
    serialNumber: plain.serialNumber,
    location: { lat: plain.lat, lon: plain.lon },
    status: plain.status,
    installedAt: toIso(plain.installedAt),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
    siteId: plain.siteId ?? null,
    passport: rawPassport
      ? {
          manufacturer: rawPassport.manufacturer ?? null,
          model: rawPassport.model ?? null,
          powerKw: rawPassport.powerKw ?? null,
          lastCheckAt: rawPassport.lastCheckAt
            ? toIso(rawPassport.lastCheckAt)
            : null,
        }
      : null,
  };
}

function buildWhere(filters = {}) {
  const where = {};
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (typeof filters.search === 'string' && filters.search.trim() !== '') {
    const needle = `%${filters.search.trim().replace(/[%_]/g, (c) => `\\${c}`)}%`;
    where.name = { [Op.iLike]: needle };
  }
  return where;
}

function buildOrder(sortBy, order) {
  const column = SORT_MAP[sortBy] ?? SORT_MAP.createdAt;
  const dir = String(order ?? '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return [[column, dir]];
}

export async function listEquipmentDB({
  type,
  status,
  search,
  sortBy = 'createdAt',
  order = 'DESC',
  limit = 20,
  offset = 0,
} = {}) {
  const where = buildWhere({ type, status, search });
  const rows = await Equipment.findAll({
    where,
    order: buildOrder(sortBy, order),
    limit,
    offset,
    attributes: EQUIPMENT_ATTRIBUTES,
    include: [PASSPORT_INCLUDE],
  });
  return rows.map(toEquipmentJSON);
}

export async function countEquipmentDB(filters = {}) {
  const where = buildWhere(filters);
  return Equipment.count({ where });
}

export async function findEquipmentById(id) {
  const row = await Equipment.findByPk(id, {
    attributes: EQUIPMENT_ATTRIBUTES,
    include: [PASSPORT_INCLUDE],
  });
  return row ? toEquipmentJSON(row) : null;
}

export async function findEquipmentBySerial(serialNumber) {
  const row = await Equipment.findOne({
    where: { serialNumber },
    attributes: EQUIPMENT_ATTRIBUTES,
    include: [PASSPORT_INCLUDE],
  });
  return row ? toEquipmentJSON(row) : null;
}

function normalizeCreateData(data = {}) {
  const payload = { ...data };
  if (
    payload.location &&
    payload.lat === undefined &&
    payload.lon === undefined
  ) {
    payload.lat = payload.location.lat;
    payload.lon = payload.location.lon;
  }
  delete payload.location;
  delete payload.passport;
  return payload;
}

function normalizePatch(patch = {}) {
  const next = { ...patch };
  if (next.location) {
    if (next.location.lat !== undefined) {
      next.lat = next.location.lat;
    }
    if (next.location.lon !== undefined) {
      next.lon = next.location.lon;
    }
    delete next.location;
  }
  delete next.passport;
  return next;
}

export async function createEquipment(data) {
  try {
    const row = await Equipment.create(normalizeCreateData(data));
    const full = await Equipment.findByPk(row.id, {
      attributes: EQUIPMENT_ATTRIBUTES,
      include: [PASSPORT_INCLUDE],
    });
    return toEquipmentJSON(full ?? row);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function updateEquipment(id, patch) {
  const row = await Equipment.findByPk(id);
  if (!row) {
    return null;
  }
  try {
    row.set(normalizePatch(patch));
    await row.save();
    const full = await Equipment.findByPk(id, {
      attributes: EQUIPMENT_ATTRIBUTES,
      include: [PASSPORT_INCLUDE],
    });
    return toEquipmentJSON(full ?? row);
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function removeEquipment(id) {
  const row = await Equipment.findByPk(id);
  if (!row) {
    return false;
  }
  await row.destroy();
  return true;
}

export async function findAllEquipment() {
  const rows = await Equipment.findAll({
    attributes: EQUIPMENT_ATTRIBUTES,
    include: [PASSPORT_INCLUDE],
    order: [['created_at', 'DESC']],
  });
  return rows.map(toEquipmentJSON);
}
