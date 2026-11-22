import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { reviewService } from './review.service';

export const reviewController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const review = await reviewService.createReview(
      req.user!.id,
      req.body,
    );
    sendResponse(res, 201, 'Review submitted successfully', review);
  }),
};
