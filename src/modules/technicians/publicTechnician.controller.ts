import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import {
  publicTechnicianService,
  TechnicianFilters,
} from './publicTechnician.service';

export const publicTechnicianController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const result = await publicTechnicianService.listTechnicians(
      req.query as unknown as TechnicianFilters,
    );
    sendResponse(
      res,
      200,
      'Technicians retrieved successfully',
      result.items,
      result.meta,
    );
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const technician = await publicTechnicianService.getTechnicianById(
      req.params.id as string,
    );
    sendResponse(
      res,
      200,
      'Technician details retrieved successfully',
      technician,
    );
  }),
};
