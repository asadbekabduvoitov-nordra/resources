import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

export class HealthController {
  check(_req: Request, res: Response): void {
    sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

export const healthController = new HealthController();
