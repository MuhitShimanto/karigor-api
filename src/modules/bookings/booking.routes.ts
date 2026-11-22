import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createBookingSchema,
  getBookingsQuerySchema,
  getBookingByIdSchema,
} from './booking.validation';
import { bookingController } from './booking.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('CUSTOMER'),
  validate(createBookingSchema),
  bookingController.create,
);
router.get('/', validate(getBookingsQuerySchema), bookingController.list);
router.get('/:id', validate(getBookingByIdSchema), bookingController.getById);

export default router;
