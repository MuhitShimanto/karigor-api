import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { paymentService } from './payment.service';

export const paymentController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const result = await paymentService.createPayment(
      req.user!.id,
      req.body,
    );
    sendResponse(res, 201, 'Payment session created successfully', result);
  }),

  confirm: catchAsync(async (req: Request, res: Response) => {
    const rawBody = req.body as Buffer;
    const result = await paymentService.confirmPayment({
      rawBody,
      headers: req.headers,
      query: req.query as Record<string, unknown>,
    });
    sendResponse(res, 200, 'Webhook processed successfully', result);
  }),
};
