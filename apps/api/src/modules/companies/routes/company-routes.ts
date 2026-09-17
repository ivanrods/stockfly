import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/auth-middleware.js';
import companyController from '../controllers/company-controller.js';

const router = Router();

router.get('/me', authMiddleware, companyController.getMine.bind(companyController));
router.put('/:id', authMiddleware, companyController.update.bind(companyController));
router.delete('/:id', authMiddleware, companyController.inactivate.bind(companyController));

export default router;