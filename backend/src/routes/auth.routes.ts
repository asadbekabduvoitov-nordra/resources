import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

// Protected routes
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));
router.get('/verify', authMiddleware, (req, res, next) => authController.verify(req, res, next));

export { router as authRoutes };
