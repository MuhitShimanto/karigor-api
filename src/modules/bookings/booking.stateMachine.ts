import { BookingStatus } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';

export const transitions: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ['ACCEPTED', 'DECLINED', 'CANCELLED'],
  ACCEPTED: ['PAID', 'CANCELLED'],
  PAID: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  DECLINED: [],
  COMPLETED: [],
  CANCELLED: [],
};

export const assertTransition = (from: BookingStatus, to: BookingStatus) => {
  if (!transitions[from].includes(to)) {
    throw new ApiError(
      409,
      `Cannot change booking from ${from} to ${to}`,
    );
  }
};
