import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { serviceQuerySchema } from './service.validation';
import { serviceController } from './service.controller';

const router = Router();

router.get('/', validate(serviceQuerySchema), serviceController.list);

export default router;
