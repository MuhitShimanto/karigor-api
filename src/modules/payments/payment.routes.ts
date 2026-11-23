import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createPaymentSchema,
  getPaymentsQuerySchema,
  getPaymentByIdSchema,
  verifySessionSchema,
} from './payment.validation';
import { paymentController } from './payment.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/create',
  authorize('CUSTOMER'),
  validate(createPaymentSchema),
  paymentController.create,
);
router.post(
  '/verify-session',
  validate(verifySessionSchema),
  paymentController.verifySession,
);
router.get('/', validate(getPaymentsQuerySchema), paymentController.list);
router.get('/:id', validate(getPaymentByIdSchema), paymentController.getById);

export default router;
