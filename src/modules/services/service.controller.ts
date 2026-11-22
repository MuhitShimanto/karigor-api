import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { serviceService, ServiceFilters } from './service.service';

export const serviceController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const result = await serviceService.listServices(
      req.query as unknown as ServiceFilters,
    );
    sendResponse(
      res,
      200,
      'Services retrieved successfully',
      result.items,
      result.meta,
    );
  }),
};
