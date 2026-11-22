import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Karigor API is running', data: null });
});

export default router;
