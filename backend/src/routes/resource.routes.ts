import { Router } from 'express';
import { resourceController } from '../controllers';
import { uploadSingle } from '../middleware';

const router = Router();

// GET /api/resources - Get all resources
router.get('/', (req, res, next) => resourceController.getAll(req, res, next));

// GET /api/resources/:id - Get single resource
router.get('/:id', (req, res, next) => resourceController.getById(req, res, next));

// POST /api/resources - Create resource (with optional file)
router.post('/', uploadSingle, (req, res, next) =>
  resourceController.create(req, res, next)
);

// PUT /api/resources/:id - Update resource (with optional file)
router.put('/:id', uploadSingle, (req, res, next) =>
  resourceController.update(req, res, next)
);

// DELETE /api/resources/:id - Delete resource
router.delete('/:id', (req, res, next) =>
  resourceController.delete(req, res, next)
);

// PATCH /api/resources/:id/toggle - Toggle active status
router.patch('/:id/toggle', (req, res, next) =>
  resourceController.toggleActive(req, res, next)
);

// POST /api/resources/upload - Upload file only
router.post('/upload', uploadSingle, (req, res, next) =>
  resourceController.uploadFile(req, res, next)
);

export { router as resourceRoutes };
