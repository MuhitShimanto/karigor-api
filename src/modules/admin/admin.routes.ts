import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createCategorySchema } from '../categories/category.validation';
import { categoryController } from '../categories/category.controller';
import {
  adminUsersQuerySchema,
  updateUserStatusSchema,
  adminBookingsQuerySchema,
  adminPaymentsQuerySchema,
} from './admin.validation';
import { adminController } from './admin.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// Categories
router.get('/categories', categoryController.listAdmin);
router.post(
  '/categories',
  validate(createCategorySchema),
  categoryController.create,
);

// Users
router.get(
  '/users',
  validate(adminUsersQuerySchema),
  adminController.listUsers,
);
router.patch(
  '/users/:id',
  validate(updateUserStatusSchema),
  adminController.updateUserStatus,
);

// Bookings
router.get(
  '/bookings',
  validate(adminBookingsQuerySchema),
  adminController.listBookings,
);

// Payments
router.get(
  '/payments',
  validate(adminPaymentsQuerySchema),
  adminController.listPayments,
);

export default router;
