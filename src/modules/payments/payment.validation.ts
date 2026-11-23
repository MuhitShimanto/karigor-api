import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
    provider: z.enum(['STRIPE', 'SSLCOMMERZ']).optional(),
  }),
});

export const getPaymentsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
    provider: z.enum(['STRIPE', 'SSLCOMMERZ']).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

export const getPaymentByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const verifySessionSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1),
  }),
});
