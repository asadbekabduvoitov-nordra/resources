import { Router } from 'express';
import { userController } from '../controllers';

const router = Router();

// GET /api/users - Get all users
router.get('/', (req, res, next) => userController.getAllUsers(req, res, next));

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res, next) =>
  userController.getUserById(req, res, next)
);

// POST /api/users - Create user
router.post('/', (req, res, next) => userController.createUser(req, res, next));

// PATCH /api/users/:id - Update user
router.patch('/:id', (req, res, next) =>
  userController.updateUser(req, res, next)
);

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req, res, next) =>
  userController.deleteUser(req, res, next)
);

// POST /api/users/:id/block - Block user
router.post('/:id/block', (req, res, next) =>
  userController.blockUser(req, res, next)
);

// POST /api/users/:id/unblock - Unblock user
router.post('/:id/unblock', (req, res, next) =>
  userController.unblockUser(req, res, next)
);

// POST /api/users/:id/send-message - Send message to user
router.post('/:id/send-message', (req, res, next) =>
  userController.sendMessage(req, res, next)
);

export { router as userRoutes };
