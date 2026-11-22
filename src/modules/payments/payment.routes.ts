import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createPaymentSchema } from './payment.validation';
import { paymentController } from './payment.controller';

const router = Router();

router.post(
  '/create',
  authenticate,
  authorize('CUSTOMER'),
  validate(createPaymentSchema),
  paymentController.create,
);

export default router;
