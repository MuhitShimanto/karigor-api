import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experienceYears: z.coerce.number().int().min(0).optional(),
    location: z.string().min(1).optional(),
    hourlyRate: z.coerce.number().min(0).optional(),
  }),
});

export const createServiceSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    categoryId: z.string().min(1),
    price: z.coerce.number().min(0),
    description: z.string().optional(),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    categoryId: z.string().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    description: z.string().optional(),
  }),
});

export const deleteServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(
      z.object({
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
      }),
    ),
  }),
});
