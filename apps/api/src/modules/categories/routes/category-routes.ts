import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import { requirePermission } from '../../../shared/middlewares/require-permission.js';
import categoryController from '../controllers/category-controller.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requirePermission('categories:read'),
  categoryController.list.bind(categoryController),
);

router.post(
  '/',
  authMiddleware,
  requirePermission('categories:create'),
  categoryController.create.bind(categoryController),
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('categories:update'),
  categoryController.update.bind(categoryController),
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('categories:delete'),
  categoryController.remove.bind(categoryController),
);

export default router;