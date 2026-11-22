import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  adminService,
  AdminUsersQuery,
  AdminBookingsQuery,
} from './admin.service';
import { paymentService, ListPaymentsQuery } from '../payments/payment.service';

export const adminController = {
  listUsers: catchAsync(async (req: Request, res: Response) => {
    const result = await adminService.listUsers(
      req.query as unknown as AdminUsersQuery,
    );
    sendResponse(
      res,
      200,
      'Users retrieved successfully',
      result.items,
      result.meta,
    );
  }),

  updateUserStatus: catchAsync(async (req: Request, res: Response) => {
    const updated = await adminService.updateUserStatus(
      req.user!.id,
      req.params.id as string,
      req.body.status,
    );
    sendResponse(
      res,
      200,
      `User status updated to ${req.body.status}`,
      updated,
    );
  }),

  listBookings: catchAsync(async (req: Request, res: Response) => {
    const result = await adminService.listAllBookings(
      req.query as unknown as AdminBookingsQuery,
    );
    sendResponse(
      res,
      200,
      'All bookings retrieved successfully',
      result.items,
      result.meta,
    );
  }),

  listPayments: catchAsync(async (req: Request, res: Response) => {
    const result = await paymentService.listPayments(
      req.user!,
      req.query as unknown as ListPaymentsQuery,
    );
    sendResponse(
      res,
      200,
      'All payments retrieved successfully',
      result.items,
      result.meta,
    );
  }),
};
