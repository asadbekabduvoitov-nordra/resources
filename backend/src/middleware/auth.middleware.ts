import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Middleware to authenticate requests using JWT
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header');
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    authService.verifyAccessToken(token);

    // Token is valid, proceed
    next();
  } catch (error) {
    logger.debug('Auth middleware error:', error);
    next(error);
  }
};

/**
 * Optional auth middleware - doesn't fail if no token, just sets auth status
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        authService.verifyAccessToken(token);
        (req as any).isAuthenticated = true;
      }
    }

    next();
  } catch {
    // Token invalid, but we don't fail - just mark as unauthenticated
    (req as any).isAuthenticated = false;
    next();
  }
};
