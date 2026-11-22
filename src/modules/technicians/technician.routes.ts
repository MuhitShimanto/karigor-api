import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  updateProfileSchema,
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
  updateAvailabilitySchema,
} from './technician.validation';
import { technicianController } from './technician.controller';

const router = Router();

router.use(authenticate, authorize('TECHNICIAN'));

router.put(
  '/profile',
  validate(updateProfileSchema),
  technicianController.updateProfile,
);
router.post(
  '/services',
  validate(createServiceSchema),
  technicianController.createService,
);
router.put(
  '/services/:id',
  validate(updateServiceSchema),
  technicianController.updateService,
);
router.delete(
  '/services/:id',
  validate(deleteServiceSchema),
  technicianController.deleteService,
);
router.put(
  '/availability',
  validate(updateAvailabilitySchema),
  technicianController.updateAvailability,
);

export default router;
