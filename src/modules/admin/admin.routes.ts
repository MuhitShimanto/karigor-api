import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createCategorySchema } from '../categories/category.validation';
import { categoryController } from '../categories/category.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/categories', categoryController.listAdmin);
router.post(
  '/categories',
  validate(createCategorySchema),
  categoryController.create,
);

export default router;
