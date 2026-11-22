import { Router } from 'express';
import { categoryController } from './category.controller';

const router = Router();

router.get('/', categoryController.listPublic);

export default router;
