import { QueryTypes } from 'sequelize';
import { sequelize, Site } from '../db/index.js';
import { NotFoundError } from '../errors/index.js';

export async function getSiteSummary(siteId) {
  const site = await Site.findByPk(siteId);
  if (!site) throw new NotFoundError('Площадка не найдена');
  // Эквивалент на Sequelize: Site.findByPk с include оборудования и заявок и подсчетом в JS
  const rows = await sequelize.query(
    `SELECT COUNT(r.id)::int AS total,
      COUNT(r.id) FILTER (WHERE r.status = 'done')::int AS "closedCount",
      COUNT(r.id) FILTER (WHERE r.status = 'new')::int AS "newCount",
      COUNT(r.id) FILTER (WHERE r.status = 'in_progress')::int AS "inProgressCount",
      COUNT(r.id) FILTER (WHERE r.status = 'done')::int AS "doneCount",
      COUNT(r.id) FILTER (WHERE r.status = 'rejected')::int AS "rejectedCount",
      COUNT(r.id) FILTER (WHERE r.priority = 'low')::int AS "lowCount",
      COUNT(r.id) FILTER (WHERE r.priority = 'medium')::int AS "mediumCount",
      COUNT(r.id) FILTER (WHERE r.priority = 'high')::int AS "highCount",
      COUNT(r.id) FILTER (WHERE r.priority = 'critical')::int AS "criticalCount",
      AVG(EXTRACT(EPOCH FROM (r.updated_at - r.created_at)) / 3600) FILTER (WHERE r.status = 'done') AS "avgCloseHours"
    FROM sites s
    LEFT JOIN equipment e ON e.site_id = s.id AND e.deleted_at IS NULL
    LEFT JOIN maintenance_requests r ON r.equipment_id = e.id AND r.deleted_at IS NULL
    WHERE s.id = :siteId`,
    { replacements: { siteId }, type: QueryTypes.SELECT }
  );
  const row = rows[0];
  return {
    site: { id: site.id, name: site.name, code: site.code },
    total: Number(row.total),
    closedCount: Number(row.closedCount),
    byStatus: {
      new: Number(row.newCount),
      in_progress: Number(row.inProgressCount),
      done: Number(row.doneCount),
      rejected: Number(row.rejectedCount),
    },
    byPriority: {
      low: Number(row.lowCount),
      medium: Number(row.mediumCount),
      high: Number(row.highCount),
      critical: Number(row.criticalCount),
    },
    avgCloseHours:
      row.avgCloseHours === null ? null : Number(row.avgCloseHours),
  };
}
