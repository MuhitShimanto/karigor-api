import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination } from '../../utils/pagination';
import { BookingStatus, User, Prisma } from '@prisma/client';

export interface CreateBookingInput {
  serviceId: string;
  slotId: string;
  address: string;
  notes?: string;
}

export interface ListBookingsQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export const bookingService = {
  async createBooking(customerId: string, input: CreateBookingInput) {
    return prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: input.serviceId },
      });
      if (!service) {
        throw new ApiError(404, 'Service not found');
      }

      const slot = await tx.availabilitySlot.findUnique({
        where: { id: input.slotId },
      });
      if (!slot || slot.technicianId !== service.technicianId) {
        throw new ApiError(
          400,
          'Slot does not belong to this technician',
        );
      }
      if (slot.isBooked) {
        throw new ApiError(409, 'This time slot is already taken');
      }
      if (slot.startTime <= new Date()) {
        throw new ApiError(400, 'Slot is in the past');
      }

      // Concurrency check
      const updated = await tx.availabilitySlot.updateMany({
        where: { id: input.slotId, isBooked: false },
        data: { isBooked: true },
      });
      if (updated.count === 0) {
        throw new ApiError(409, 'This time slot is already taken');
      }

      return tx.booking.create({
        data: {
          customerId,
          technicianId: service.technicianId,
          serviceId: input.serviceId,
          slotId: input.slotId,
          address: input.address,
          notes: input.notes,
          totalAmount: service.price,
          status: 'REQUESTED',
        },
        include: {
          service: true,
          slot: true,
          technician: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
        },
      });
    });
  },

  async listBookings(user: User, query: ListBookingsQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.BookingWhereInput = {};
    if (user.role === 'CUSTOMER') {
      where.customerId = user.id;
    } else if (user.role === 'TECHNICIAN') {
      const profile = await prisma.technicianProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) {
        return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.technicianId = profile.id;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await prisma.$transaction([
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
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
        },
      }),
      prisma.booking.count({ where }),
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

  async getBookingById(user: User, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        slot: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        technician: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const isCustomer = booking.customerId === user.id;
    const isTechnician = booking.technician.userId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isCustomer && !isTechnician && !isAdmin) {
      throw new ApiError(
        403,
        'You do not have permission to view this booking',
      );
    }

    return booking;
  },
};
