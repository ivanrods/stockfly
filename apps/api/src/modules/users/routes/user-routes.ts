import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import userController from '../controllers/user-controller.js';

const router = Router();

router.get('/me', authMiddleware, userController.getMe.bind(userController));

export default router;