import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { bookingService, ListBookingsQuery } from './booking.service';

export const bookingController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.createBooking(
      req.user!.id,
      req.body,
    );
    sendResponse(res, 201, 'Booking requested successfully', booking);
  }),

  list: catchAsync(async (req: Request, res: Response) => {
    const result = await bookingService.listBookings(
      req.user!,
      req.query as unknown as ListBookingsQuery,
    );
    sendResponse(
      res,
      200,
      'Bookings retrieved successfully',
      result.items,
      result.meta,
    );
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.getBookingById(
      req.user!,
      req.params.id as string,
    );
    sendResponse(res, 200, 'Booking details retrieved successfully', booking);
  }),
};
