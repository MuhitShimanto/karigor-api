import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createReviewSchema } from './review.validation';
import { reviewController } from './review.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('CUSTOMER'),
  validate(createReviewSchema),
  reviewController.create,
);

export default router;
