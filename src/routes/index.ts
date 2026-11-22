import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import categoryRoutes from '../modules/categories/category.routes';
import adminRoutes from '../modules/admin/admin.routes';
import technicianRoutes from '../modules/technicians/technician.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Karigor API is running', data: null });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/technician', technicianRoutes);

export default router;
