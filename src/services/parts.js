import {
  sequelize,
  MaintenanceRequest,
  SparePart,
  RequestSparePart,
} from '../db/index.js';
import { NotFoundError, ConflictError } from '../errors/index.js';
import { mapDbError } from '../db/errors.js';

export async function setParts(requestId, list) {
  try {
    return await sequelize.transaction(async (t) => {
      const request = await MaintenanceRequest.findByPk(requestId, {
        transaction: t,
      });
      if (!request) throw new NotFoundError('Заявка не найдена');
      const items = list ?? [];
      const seen = new Set();
      for (const item of items) {
        if (seen.has(item.sparePartId)) {
          throw new ConflictError('Запчасть уже добавлена к заявке');
        }
        seen.add(item.sparePartId);
      }
      const olds = await RequestSparePart.findAll({
        where: { requestId },
        transaction: t,
      });
      for (const row of olds) {
        const spare = await SparePart.findByPk(row.sparePartId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (spare) {
          spare.stock += row.qty;
          await spare.save({ transaction: t });
        }
      }
      await RequestSparePart.destroy({
        where: { requestId },
        transaction: t,
      });
      const rows = [];
      for (const item of items) {
        const spare = await SparePart.findByPk(item.sparePartId, {
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!spare) throw new NotFoundError('Запчасть не найдена');
        spare.stock -= item.qty;
        if (spare.stock < 0) {
          throw new ConflictError(
            `Недостаточно запчастей на складе: ${spare.sku}`
          );
        }
        await spare.save({ transaction: t });
        rows.push({
          requestId,
          sparePartId: item.sparePartId,
          qty: item.qty,
        });
      }
      if (rows.length > 0) {
        await RequestSparePart.bulkCreate(rows, { transaction: t });
      }
      const links = await RequestSparePart.findAll({
        where: { requestId },
        transaction: t,
      });
      if (links.length === 0) return [];
      const spares = await SparePart.findAll({
        where: { id: links.map((r) => r.sparePartId) },
        transaction: t,
      });
      const byId = new Map(spares.map((s) => [s.id, s]));
      return links.map((r) => {
        const s = byId.get(r.sparePartId);
        return { id: s.id, name: s.name, sku: s.sku, qty: r.qty };
      });
    });
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function getParts(requestId) {
  try {
    const request = await MaintenanceRequest.findByPk(requestId);
    if (!request) throw new NotFoundError('Заявка не найдена');
    const links = await RequestSparePart.findAll({ where: { requestId } });
    if (links.length === 0) return [];
    const spares = await SparePart.findAll({
      where: { id: links.map((r) => r.sparePartId) },
    });
    const byId = new Map(spares.map((s) => [s.id, s]));
    return links.map((r) => {
      const s = byId.get(r.sparePartId);
      return { id: s.id, name: s.name, sku: s.sku, qty: r.qty };
    });
  } catch (err) {
    throw mapDbError(err);
  }
}

export async function removePart(requestId, partId) {
  try {
    await sequelize.transaction(async (t) => {
      const request = await MaintenanceRequest.findByPk(requestId, {
        transaction: t,
      });
      if (!request) throw new NotFoundError('Заявка не найдена');
      const row = await RequestSparePart.findOne({
        where: { requestId, sparePartId: partId },
        transaction: t,
      });
      if (!row) throw new NotFoundError('Запчасть не найдена в заявке');
      const spare = await SparePart.findByPk(partId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (spare) {
        spare.stock += row.qty;
        await spare.save({ transaction: t });
      }
      await row.destroy({ transaction: t });
    });
  } catch (err) {
    throw mapDbError(err);
  }
}
