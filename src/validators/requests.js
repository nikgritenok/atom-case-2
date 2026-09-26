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
    author: z.string().max(200).optional(),
    comment: z.string().max(2000).optional(),
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

export const assigneesBody = z
  .object({
    assignees: z.array(
      z
        .object({
          technicianId: z.string().uuid(),
          role: z.enum(['lead', 'member']),
          hours: z.number().min(0).max(1000),
        })
        .strip()
    ),
  })
  .strip();

export const userIdParam = z.object({ userId: z.string().uuid() }).strip();

export const partsBody = z
  .object({
    parts: z.array(
      z
        .object({
          sparePartId: z.string().uuid('Некорректный идентификатор запчасти'),
          qty: z
            .number({
              required_error: 'Количество вне диапазона',
              invalid_type_error: 'Количество вне диапазона',
            })
            .int('Количество вне диапазона')
            .min(1, 'Количество вне диапазона')
            .max(1000, 'Количество вне диапазона'),
        })
        .strip()
    ),
  })
  .strip();

export const partIdParam = z.object({
  partId: z.string().uuid('Некорректный идентификатор запчасти'),
});
export { idParam };
