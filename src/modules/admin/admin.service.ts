import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination } from '../../utils/pagination';
import { Role, UserStatus, BookingStatus, Prisma } from '@prisma/client';

export interface AdminUsersQuery {
  role?: Role;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminBookingsQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export const adminService = {
  async listUsers(query: AdminUsersQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          createdAt: true,
          technicianProfile: {
            select: {
              id: true,
              location: true,
              avgRating: true,
              reviewCount: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async updateUserStatus(
    currentAdminId: string,
    targetUserId: string,
    status: UserStatus,
  ) {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new ApiError(404, 'User not found');
    if (target.role === 'ADMIN') {
      throw new ApiError(403, 'Admin accounts cannot be banned');
    }
    if (target.id === currentAdminId) {
      throw new ApiError(403, 'You cannot change your own status');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
    });

    return updated;
  },

  async listAllBookings(query: AdminBookingsQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.BookingWhereInput = {
      ...(query.status && { status: query.status }),
    };

    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
          slot: true,
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          technician: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
          payments: true,
          review: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      items: bookings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
