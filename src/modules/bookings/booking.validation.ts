import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, 'serviceId is required'),
    slotId: z.string().min(1, 'slotId is required'),
    address: z.string().trim().min(5, 'address must be at least 5 characters'),
    notes: z.string().optional(),
  }),
});

export const getBookingsQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(BookingStatus).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

export const getBookingByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
