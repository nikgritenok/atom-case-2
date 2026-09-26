import { z } from 'zod';

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Некорректная дата');

export const equipmentLoadQuery = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    minRequests: z.coerce.number().int().min(0).max(1000).default(0),
  })
  .strip();
