import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination } from '../../utils/pagination';
import { Prisma } from '@prisma/client';

export interface TechnicianFilters {
  category?: string;
  location?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'price' | 'experience';
  order?: 'asc' | 'desc';
}

export const publicTechnicianService = {
  async listTechnicians(filters: TechnicianFilters) {
    const { skip, take, page, limit } = getPagination(filters);
    const orderDirection = filters.order ?? 'desc';

    const where: Prisma.TechnicianProfileWhereInput = {
      user: { status: 'ACTIVE' },
      ...(filters.location && {
        location: { contains: filters.location, mode: 'insensitive' },
      }),
      ...(filters.minRating && {
        avgRating: { gte: Number(filters.minRating) },
      }),
      ...(filters.category && {
        services: { some: { categoryId: filters.category } },
      }),
      ...(filters.minPrice !== undefined && {
        hourlyRate: { gte: new Prisma.Decimal(filters.minPrice) },
      }),
      ...(filters.maxPrice !== undefined && {
        hourlyRate: { lte: new Prisma.Decimal(filters.maxPrice) },
      }),
      ...(filters.search && {
        OR: [
          {
            user: {
              name: { contains: filters.search, mode: 'insensitive' },
            },
          },
          { bio: { contains: filters.search, mode: 'insensitive' } },
          { location: { contains: filters.search, mode: 'insensitive' } },
          {
            services: {
              some: {
                title: { contains: filters.search, mode: 'insensitive' },
              },
            },
          },
        ],
      }),
    };

    let orderBy: Prisma.TechnicianProfileOrderByWithRelationInput = {
      avgRating: orderDirection,
    };
    if (filters.sortBy === 'price') {
      orderBy = { hourlyRate: orderDirection };
    } else if (filters.sortBy === 'experience') {
      orderBy = { experienceYears: orderDirection };
    }

    const [items, total] = await prisma.$transaction([
      prisma.technicianProfile.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          services: { include: { category: true } },
        },
      }),
      prisma.technicianProfile.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getTechnicianById(id: string) {
    const technician = await prisma.technicianProfile.findFirst({
      where: {
        id,
        user: { status: 'ACTIVE' },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        services: { include: { category: true } },
        slots: {
          where: {
            isBooked: false,
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!technician) {
      throw new ApiError(404, 'Technician not found');
    }

    return technician;
  },
};
