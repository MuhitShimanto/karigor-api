import { z } from 'zod';

export const serviceQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    location: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    sortBy: z
      .enum(['rating', 'price', 'experience'])
      .optional()
      .default('price'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});
