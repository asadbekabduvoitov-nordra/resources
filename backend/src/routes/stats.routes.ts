import { Router } from 'express';
import { statsController } from '../controllers';

const router = Router();

// GET /api/stats/dashboard - Get dashboard statistics
router.get('/dashboard', (req, res, next) =>
  statsController.getDashboardStats(req, res, next)
);

export { router as statsRoutes };
