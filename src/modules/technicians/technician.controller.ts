import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { technicianService } from './technician.service';

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
};
