import { Request, Response, NextFunction } from 'express';
import { statsService } from '../services';
import { sendSuccess } from '../utils/response';

export class StatsController {
  async getDashboardStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await statsService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const statsController = new StatsController();
