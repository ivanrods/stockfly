import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import { requirePermission } from '../../../shared/middlewares/require-permission.js';
import roleController from '../controllers/role-controller.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requirePermission('users:read'),
  roleController.list.bind(roleController),
);

export default router;
