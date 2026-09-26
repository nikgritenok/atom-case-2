import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

export async function getEquipmentLoad({ from, to, minRequests = 0 } = {}) {
  const conditions = ['e.deleted_at IS NULL'];
  const replacements = { min: minRequests ?? 0 };
  if (from !== undefined) {
    conditions.push('r.created_at >= :from');
    replacements.from = from;
  }
  if (to !== undefined) {
    conditions.push('r.created_at <= :to');
    replacements.to = to;
  }
  const rows = await sequelize.query(
    `SELECT e.id AS "equipmentId", e.name AS "name", e.serial_number AS "serialNumber",
      COUNT(DISTINCT r.id)::int AS "requestCount",
      COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'done')::int AS "closedCount",
      COALESCE(SUM(a.hours), 0) AS "totalHours",
      MAX(r.updated_at) FILTER (WHERE r.status = 'done') AS "lastDoneAt"
    FROM equipment e
    LEFT JOIN maintenance_requests r ON r.equipment_id = e.id AND r.deleted_at IS NULL
    LEFT JOIN request_assignees a ON a.request_id = r.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY e.id, e.name, e.serial_number
    HAVING COUNT(DISTINCT r.id) >= :min
    ORDER BY e.name ASC`,
    { replacements, type: QueryTypes.SELECT }
  );
  const data = rows.map((row) => ({
    equipmentId: row.equipmentId,
    name: row.name,
    serialNumber: row.serialNumber,
    requestCount: Number(row.requestCount),
    closedCount: Number(row.closedCount),
    totalHours: Number(row.totalHours),
    lastDoneAt: row.lastDoneAt,
  }));
  return { data, meta: { total: data.length } };
}
