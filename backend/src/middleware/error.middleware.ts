import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config';
import { notificationService } from '../services';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Log the error
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path });

  // Send error notification to developer (async, don't wait)
  notificationService.notifyApiError(err, req.method, req.path).catch(() => {});

  // Handle known application errors
  if (err instanceof ValidationError) {
    return sendError(
      res,
      err.code,
      err.message,
      err.statusCode,
      err.errors
    );
  }

  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode);
  }

  // Handle unknown errors
  const statusCode = 500;
  const message = env.isProduction
    ? 'An unexpected error occurred'
    : err.message;

  return sendError(res, 'INTERNAL_ERROR', message, statusCode);
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  return sendError(
    res,
    'NOT_FOUND',
    `Route ${req.method} ${req.path} not found`,
    404
  );
}
