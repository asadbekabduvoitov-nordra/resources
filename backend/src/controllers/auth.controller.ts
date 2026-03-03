import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * POST /api/auth/login
   * Login with password
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;

      if (!password) {
        throw new BadRequestError('Password is required');
      }

      const tokens = await authService.login(password);

      sendSuccess(res, tokens, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh tokens
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      const tokens = await authService.refreshTokens(refreshToken);

      sendSuccess(res, tokens, 'Tokens refreshed');
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout (client-side token removal)
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a more complex system, we would invalidate the token server-side
      // For now, we just return success and let the client remove the token
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/verify
   * Verify if token is valid (used by frontend to check auth status)
   */
  async verify(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // If we reach here, the auth middleware has already verified the token
      sendSuccess(res, { valid: true }, 'Token is valid');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
