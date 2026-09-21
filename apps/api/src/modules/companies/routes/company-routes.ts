import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import { requireRole } from '../../../shared/middlewares/require-role.js';
import companyController from '../controllers/company-controller.js';

const router = Router();

router.get('/me', authMiddleware, companyController.getMine.bind(companyController));
router.put(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  companyController.update.bind(companyController),
);
router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  companyController.inactivate.bind(companyController),
);

export default router;
