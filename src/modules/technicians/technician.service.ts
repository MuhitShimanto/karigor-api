import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { getPagination } from '../../utils/pagination';
import { assertTransition } from '../bookings/booking.stateMachine';
import { Prisma, BookingStatus } from '@prisma/client';

export type TechnicianAction = 'accept' | 'decline' | 'start' | 'complete';

const actionToStatusMap: Record<TechnicianAction, BookingStatus> = {
  accept: 'ACCEPTED',
  decline: 'DECLINED',
  start: 'IN_PROGRESS',
  complete: 'COMPLETED',
};

export interface TechnicianBookingsQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export const technicianService = {
  async getProfileByUserId(userId: string) {
    let profile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      profile = await prisma.technicianProfile.create({
        data: {
          userId,
          location: '',
          hourlyRate: new Prisma.Decimal(0),
          skills: [],
        },
      });
    }
    return profile;
  },

  async updateProfile(
    userId: string,
    data: {
      bio?: string;
      skills?: string[];
      experienceYears?: number;
      location?: string;
      hourlyRate?: number;
    },
  ) {
    const profile = await this.getProfileByUserId(userId);
    return prisma.technicianProfile.update({
      where: { id: profile.id },
      data: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.skills !== undefined && { skills: data.skills }),
        ...(data.experienceYears !== undefined && {
          experienceYears: data.experienceYears,
        }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.hourlyRate !== undefined && {
          hourlyRate: new Prisma.Decimal(data.hourlyRate),
        }),
      },
    });
  },

  async createService(
    userId: string,
    data: {
      title: string;
      categoryId: string;
      price: number;
      description?: string;
    },
  ) {
    const profile = await this.getProfileByUserId(userId);
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    return prisma.service.create({
      data: {
        technicianId: profile.id,
        categoryId: data.categoryId,
        title: data.title,
        price: new Prisma.Decimal(data.price),
        description: data.description,
      },
      include: {
        category: true,
      },
    });
  },

  async updateService(
    userId: string,
    serviceId: string,
    data: {
      title?: string;
      categoryId?: string;
      price?: number;
      description?: string;
    },
  ) {
    const profile = await this.getProfileByUserId(userId);
    const service = await prisma.service.findFirst({
      where: { id: serviceId, technicianId: profile.id },
    });
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new ApiError(404, 'Category not found');
      }
    }

    return prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.price !== undefined && {
          price: new Prisma.Decimal(data.price),
        }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
      include: {
        category: true,
      },
    });
  },

  async deleteService(userId: string, serviceId: string) {
    const profile = await this.getProfileByUserId(userId);
    const service = await prisma.service.findFirst({
      where: { id: serviceId, technicianId: profile.id },
    });
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    const activeBookings = await prisma.booking.findFirst({
      where: {
        serviceId,
        status: {
          notIn: ['COMPLETED', 'DECLINED', 'CANCELLED'],
        },
      },
    });

    if (activeBookings) {
      throw new ApiError(409, 'Cannot delete service with active bookings');
    }

    return prisma.service.delete({
      where: { id: serviceId },
    });
  },

  async updateAvailability(
    userId: string,
    slots: Array<{ startTime: string; endTime: string }>,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const now = new Date();

    const parsedSlots = slots.map((s) => ({
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
    }));

    for (const slot of parsedSlots) {
      if (slot.startTime <= now) {
        throw new ApiError(400, 'Slot start time must be in the future');
      }
      if (slot.endTime <= slot.startTime) {
        throw new ApiError(400, 'Slot end time must be after start time');
      }
    }

    parsedSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 1; i < parsedSlots.length; i++) {
      if (parsedSlots[i].startTime < parsedSlots[i - 1].endTime) {
        throw new ApiError(409, 'Availability slots must not overlap each other');
      }
    }

    const existingBookedSlots = await prisma.availabilitySlot.findMany({
      where: {
        technicianId: profile.id,
        isBooked: true,
        endTime: { gte: now },
      },
    });

    for (const slot of parsedSlots) {
      for (const booked of existingBookedSlots) {
        if (slot.startTime < booked.endTime && slot.endTime > booked.startTime) {
          throw new ApiError(
            409,
            'Slot overlaps with an existing booked slot',
          );
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.deleteMany({
        where: {
          technicianId: profile.id,
          isBooked: false,
          startTime: { gte: now },
        },
      });

      if (parsedSlots.length > 0) {
        await tx.availabilitySlot.createMany({
          data: parsedSlots.map((s) => ({
            technicianId: profile.id,
            startTime: s.startTime,
            endTime: s.endTime,
            isBooked: false,
          })),
        });
      }

      return tx.availabilitySlot.findMany({
        where: { technicianId: profile.id },
        orderBy: { startTime: 'asc' },
      });
    });
  },

  async listBookings(userId: string, query: TechnicianBookingsQuery) {
    const profile = await this.getProfileByUserId(userId);
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.BookingWhereInput = {
      technicianId: profile.id,
      ...(query.status && { status: query.status }),
    };

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
          review: true,
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

  async handleBookingAction(
    userId: string,
    bookingId: string,
    action: TechnicianAction,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, technicianId: profile.id },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const targetStatus = actionToStatusMap[action];
    assertTransition(booking.status, targetStatus);

    return prisma.$transaction(async (tx) => {
      if (targetStatus === 'DECLINED') {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { isBooked: false },
        });
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: { status: targetStatus },
        include: {
          service: true,
          slot: true,
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          review: true,
        },
      });
    });
  },
};
