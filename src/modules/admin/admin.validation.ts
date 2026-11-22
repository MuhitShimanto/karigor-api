import { z } from 'zod';
import {
  Role,
  UserStatus,
  BookingStatus,
  PaymentStatus,
  PaymentProvider,
} from '@prisma/client';

export const adminUsersQuerySchema = z.object({
  query: z.object({
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.nativeEnum(UserStatus),
  }),
});

export const adminBookingsQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(BookingStatus).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

export const adminPaymentsQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(PaymentStatus).optional(),
    provider: z.nativeEnum(PaymentProvider).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});
