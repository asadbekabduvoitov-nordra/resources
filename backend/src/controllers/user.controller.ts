import { Request, Response, NextFunction } from 'express';
import { userService, messageService } from '../services';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { BadRequestError } from '../utils/errors';

export class UserController {
  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Check for pagination params
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
      const search = (req.query.search as string) || '';
      const status = (req.query.status as 'all' | 'active' | 'blocked' | 'inactive') || 'all';
      const sortBy = (req.query.sortBy as 'created_at' | 'last_active_at' | 'first_name') || 'created_at';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const result = await userService.getPaginatedUsers({
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await userService.getUserById(id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { telegram_id, username, first_name, last_name, language_code } =
        req.body;

      if (!telegram_id) {
        throw new BadRequestError('telegram_id is required');
      }

      const user = await userService.createUser({
        telegram_id,
        username,
        first_name,
        last_name,
        language_code,
      });

      sendCreated(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      const user = await userService.updateUser(id, updateData);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      await userService.deleteUser(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/block
   * Block a user
   */
  async blockUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const dbUser = await userService.getUserById(id);
      const user = await userService.blockUser(dbUser.telegram_id);
      sendSuccess(res, user, 'User blocked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/unblock
   * Unblock a user
   */
  async unblockUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const dbUser = await userService.getUserById(id);
      const user = await userService.unblockUser(dbUser.telegram_id);
      sendSuccess(res, user, 'User unblocked successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/send-message
   * Send a message to a specific user
   */
  async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        throw new BadRequestError('Message is required');
      }

      const user = await userService.getUserById(id);

      if (user.is_blocked) {
        throw new BadRequestError('Cannot send message to blocked user');
      }

      const result = await messageService.sendMessageToUser(
        user.telegram_id,
        message
      );

      if (!result.success) {
        throw new BadRequestError(result.error || 'Failed to send message');
      }

      sendSuccess(res, { messageId: result.messageId }, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
