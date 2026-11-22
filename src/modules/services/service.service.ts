import { prisma } from '../../config/prisma';
import { getPagination } from '../../utils/pagination';
import { Prisma } from '@prisma/client';

export interface ServiceFilters {
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

export const serviceService = {
  async listServices(filters: ServiceFilters) {
    const { skip, take, page, limit } = getPagination(filters);
    const orderDirection = filters.order ?? 'asc';

    const where: Prisma.ServiceWhereInput = {
      technician: {
        user: { status: 'ACTIVE' },
        ...(filters.location && {
          location: { contains: filters.location, mode: 'insensitive' },
        }),
        ...(filters.minRating && {
          avgRating: { gte: Number(filters.minRating) },
        }),
      },
      ...(filters.category && { categoryId: filters.category }),
      ...(filters.minPrice !== undefined && {
        price: { gte: new Prisma.Decimal(filters.minPrice) },
      }),
      ...(filters.maxPrice !== undefined && {
        price: { lte: new Prisma.Decimal(filters.maxPrice) },
      }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    let orderBy: Prisma.ServiceOrderByWithRelationInput = {
      price: orderDirection,
    };
    if (filters.sortBy === 'rating') {
      orderBy = { technician: { avgRating: orderDirection } };
    } else if (filters.sortBy === 'experience') {
      orderBy = { technician: { experienceYears: orderDirection } };
    }

    const [items, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          technician: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
        },
      }),
      prisma.service.count({ where }),
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
};
