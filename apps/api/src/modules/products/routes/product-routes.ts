import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import { requirePermission } from '../../../shared/middlewares/require-permission.js';
import productController from '../controllers/product-controller.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  requirePermission('products:read'),
  productController.list.bind(productController),
);

router.post(
  '/',
  authMiddleware,
  requirePermission('products:create'),
  productController.create.bind(productController),
);

router.get(
  '/:id',
  authMiddleware,
  requirePermission('products:read'),
  productController.getById.bind(productController),
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('products:update'),
  productController.update.bind(productController),
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('products:delete'),
  productController.remove.bind(productController),
);

export default router;
