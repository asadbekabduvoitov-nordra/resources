import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { healthRoutes } from './health.routes';
import { resourceRoutes } from './resource.routes';
import { statsRoutes } from './stats.routes';
import { broadcastRoutes } from './broadcast.routes';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no auth required)
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Protected routes (auth required)
router.use('/users', authMiddleware, userRoutes);
router.use('/resources', authMiddleware, resourceRoutes);
router.use('/stats', authMiddleware, statsRoutes);
router.use('/broadcasts', authMiddleware, broadcastRoutes);

export { router as apiRoutes };
