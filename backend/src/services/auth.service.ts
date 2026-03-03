import jwt from 'jsonwebtoken';
import { env } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface TokenPayload {
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = env.auth.jwtSecret;
    this.accessTokenExpiry = env.auth.jwtExpiresIn;
    this.refreshTokenExpiry = env.auth.jwtRefreshExpiresIn;
  }

  /**
   * Validate password and generate tokens
   */
  async login(password: string): Promise<AuthTokens> {
    // Validate password
    if (password !== env.auth.adminPassword) {
      logger.warn('Invalid login attempt');
      throw new UnauthorizedError('Invalid password');
    }

    logger.info('Admin login successful');

    // Generate tokens
    return this.generateTokens();
  }

  /**
   * Generate new tokens from refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtSecret) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      logger.info('Token refresh successful');
      return this.generateTokens();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;

      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(): AuthTokens {
    const accessToken = jwt.sign(
      { type: 'access' } as TokenPayload,
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { type: 'refresh' } as TokenPayload,
      this.jwtSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    // Parse expiry for response
    const expiresIn = this.parseExpiry(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }
}

export const authService = new AuthService();
