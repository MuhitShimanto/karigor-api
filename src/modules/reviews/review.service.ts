import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment?: string;
}

export const reviewService = {
  async createReview(customerId: string, input: CreateReviewInput) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking || booking.customerId !== customerId) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status !== 'COMPLETED') {
      throw new ApiError(
        409,
        'Reviews can only be submitted for completed bookings',
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { bookingId: input.bookingId },
    });
    if (existingReview) {
      throw new ApiError(409, 'A review already exists for this booking');
    }

    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId: input.bookingId,
          customerId,
          technicianId: booking.technicianId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      const agg = await tx.review.aggregate({
        where: { technicianId: booking.technicianId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.technicianProfile.update({
        where: { id: booking.technicianId },
        data: {
          avgRating: Number((agg._avg.rating ?? 0).toFixed(2)),
          reviewCount: agg._count,
        },
      });

      return review;
    });
  },
};
