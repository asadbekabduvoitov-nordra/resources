import { Router } from 'express';
import { healthController } from '../controllers';

const router = Router();

router.get('/', (req, res) => healthController.check(req, res));

export { router as healthRoutes };
