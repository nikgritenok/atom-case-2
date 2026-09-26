import { z } from 'zod';

const equipmentTypes = ['turbine', 'inverter', 'sensor', 'substation'];
const equipmentStatuses = [
  'operational',
  'maintenance',
  'fault',
  'decommissioned',
];

export const idParam = z.object({
  id: z.string().uuid('Некорректный идентификатор'),
});

export const equipmentCreate = z
  .object({
    name: z.string().min(3, 'Название короче 3 символов').max(100),
    type: z.enum(equipmentTypes, 'Недопустимый тип'),
    serialNumber: z.string().min(1, 'Серийный номер обязателен'),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    }),
    status: z.enum(equipmentStatuses, 'Недопустимый статус'),
    installedAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Некорректная дата')
      .refine(
        (v) => new Date(v) <= new Date(),
        'Дата установки не может быть в будущем'
      ),
  })
  .strip();

export const equipmentUpdate = equipmentCreate.partial().strip();

export const equipmentListQuery = z
  .object({
    type: z.enum(equipmentTypes).optional(),
    status: z.enum(equipmentStatuses).optional(),
    search: z.string().max(100).optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strip();
