import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  technicianService,
  TechnicianAction,
  TechnicianBookingsQuery,
} from './technician.service';

export const technicianController = {
  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const updated = await technicianService.updateProfile(
      req.user!.id,
      req.body,
    );
    sendResponse(res, 200, 'Technician profile updated successfully', updated);
  }),

  createService: catchAsync(async (req: Request, res: Response) => {
    const service = await technicianService.createService(
      req.user!.id,
      req.body,
    );
    sendResponse(res, 201, 'Service created successfully', service);
  }),

  updateService: catchAsync(async (req: Request, res: Response) => {
    const service = await technicianService.updateService(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendResponse(res, 200, 'Service updated successfully', service);
  }),

  deleteService: catchAsync(async (req: Request, res: Response) => {
    const deleted = await technicianService.deleteService(
      req.user!.id,
      req.params.id as string,
    );
    sendResponse(res, 200, 'Service deleted successfully', deleted);
  }),

  updateAvailability: catchAsync(async (req: Request, res: Response) => {
    const slots = await technicianService.updateAvailability(
      req.user!.id,
      req.body.slots,
    );
    sendResponse(
      res,
      200,
      'Technician availability updated successfully',
      slots,
    );
  }),

  listBookings: catchAsync(async (req: Request, res: Response) => {
    const result = await technicianService.listBookings(
      req.user!.id,
      req.query as unknown as TechnicianBookingsQuery,
    );
    sendResponse(
      res,
      200,
      'Technician bookings retrieved successfully',
      result.items,
      result.meta,
    );
  }),

  handleBookingAction: catchAsync(async (req: Request, res: Response) => {
    const updated = await technicianService.handleBookingAction(
      req.user!.id,
      req.params.id as string,
      req.body.action as TechnicianAction,
    );
    sendResponse(
      res,
      200,
      `Booking ${req.body.action}ed successfully`,
      updated,
    );
  }),
};
