import { z } from 'zod';

export const siteIdParam = z.object({
  id: z.string().uuid('Некорректный идентификатор'),
});
