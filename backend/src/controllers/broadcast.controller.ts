import { Request, Response, NextFunction } from 'express';
import { broadcastService } from '../services/broadcast.service';
import { storageService } from '../services/storage.service';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class BroadcastController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const broadcasts = await broadcastService.getAllBroadcasts();
      sendSuccess(res, broadcasts);
    } catch (error) {
      logger.error('Error getting broadcasts:', error);
      await notificationService.notifyBotError(error as Error, 'get_broadcasts');
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const broadcast = await broadcastService.getBroadcastById(id);

      if (!broadcast) {
        throw new NotFoundError('Broadcast not found');
      }

      sendSuccess(res, broadcast);
    } catch (error) {
      logger.error('Error getting broadcast:', error);
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message_text, media_type } = req.body;
      let media_url: string | undefined;

      // Handle file upload if present
      if (req.file) {
        const uploadResult = await storageService.uploadFile(req.file, 'media');
        media_url = uploadResult.url;
      } else if (req.body.media_url) {
        media_url = req.body.media_url;
      }

      const broadcast = await broadcastService.createBroadcast({
        message_text,
        media_type: media_type || 'none',
        media_url,
      });

      sendCreated(res, broadcast, 'Broadcast created');
    } catch (error) {
      logger.error('Error creating broadcast:', error);
      await notificationService.notifyBotError(error as Error, 'create_broadcast');
      next(error);
    }
  }

  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      await broadcastService.startBroadcast(id);

      sendSuccess(res, { id }, 'Broadcast started');
    } catch (error) {
      logger.error('Error starting broadcast:', error);
      await notificationService.notifyBotError(error as Error, 'start_broadcast');
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const broadcast = await broadcastService.cancelBroadcast(id);

      sendSuccess(res, broadcast, 'Broadcast cancelled');
    } catch (error) {
      logger.error('Error cancelling broadcast:', error);
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      await broadcastService.deleteBroadcast(id);

      sendNoContent(res);
    } catch (error) {
      logger.error('Error deleting broadcast:', error);
      next(error);
    }
  }
}

export const broadcastController = new BroadcastController();
