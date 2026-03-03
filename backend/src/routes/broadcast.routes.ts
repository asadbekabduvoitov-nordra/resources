import { Router } from 'express';
import { broadcastController } from '../controllers/broadcast.controller';
import { uploadMedia } from '../middleware/upload.middleware';

const router = Router();

// Get all broadcasts
router.get('/', (req, res, next) => broadcastController.getAll(req, res, next));

// Get broadcast by ID
router.get('/:id', (req, res, next) => broadcastController.getById(req, res, next));

// Create new broadcast (with optional file upload)
router.post('/', uploadMedia, (req, res, next) => broadcastController.create(req, res, next));

// Start broadcast (send to all users)
router.post('/:id/start', (req, res, next) => broadcastController.start(req, res, next));

// Cancel active broadcast
router.post('/:id/cancel', (req, res, next) => broadcastController.cancel(req, res, next));

// Delete broadcast
router.delete('/:id', (req, res, next) => broadcastController.delete(req, res, next));

export { router as broadcastRoutes };
