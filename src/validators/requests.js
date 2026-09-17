import { z } from 'zod';
import { idParam } from './equipment.js';

const priorities = ['low', 'medium', 'high', 'critical'];
const statuses = ['new', 'in_progress', 'done', 'rejected'];

export const requestCreate = z
  .object({
    equipmentId: z.string().uuid('Некорректный идентификатор оборудования'),
    title: z.string().min(5, 'Заголовок короче 5 символов').max(120),
    description: z.string().max(2000).optional(),
    priority: z.enum(priorities, 'Недопустимый приоритет'),
    plannedAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Некорректная дата')
      .optional(),
  })
  .strip();

export const requestUpdate = z
  .object({
    title: z.string().min(5).max(120).optional(),
    description: z.string().max(2000).optional(),
    priority: z.enum(priorities).optional(),
    plannedAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Некорректная дата')
      .optional(),
  })
  .strip();

export const requestStatusChange = z
  .object({
    status: z.enum(statuses, 'Недопустимый статус'),
  })
  .strip();

export const requestListQuery = z
  .object({
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    equipmentId: z.string().uuid().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strip();

export { idParam };
