import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import { requirePermission } from '../../../shared/middlewares/require-permission.js';
import userController from '../controllers/user-controller.js';

const router = Router();

router.get('/me', authMiddleware, userController.getMe.bind(userController));

router.get(
  '/',
  authMiddleware,
  requirePermission('users:read'),
  userController.list.bind(userController),
);

router.post(
  '/',
  authMiddleware,
  requirePermission('users:create'),
  userController.create.bind(userController),
);

router.put(
  '/:id/role',
  authMiddleware,
  requirePermission('users:update'),
  userController.updateRole.bind(userController),
);

export default router;
