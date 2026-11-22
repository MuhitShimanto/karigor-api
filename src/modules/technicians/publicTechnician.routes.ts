import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';
import { publicTechnicianController } from './publicTechnician.controller';

const router = Router();

export const technicianQuerySchema = z.object({
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
      .default('rating'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const technicianByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

router.get(
  '/',
  validate(technicianQuerySchema),
  publicTechnicianController.list,
);
router.get(
  '/:id',
  validate(technicianByIdSchema),
  publicTechnicianController.getById,
);

export default router;
