import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import { requirePermission } from '../../../shared/middlewares/require-permission.js';
import supplierController from '../controllers/supplier-controller.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requirePermission('suppliers:read'),
  supplierController.list.bind(supplierController),
);

router.post(
  '/',
  authMiddleware,
  requirePermission('suppliers:create'),
  supplierController.create.bind(supplierController),
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('suppliers:update'),
  supplierController.update.bind(supplierController),
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('suppliers:delete'),
  supplierController.remove.bind(supplierController),
);

export default router;
