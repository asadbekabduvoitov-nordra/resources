import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config';
import { apiRoutes } from './routes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';
import { getBot } from './bot';
import { logger } from './utils/logger';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration - supports multiple origins separated by comma
  const corsOrigins = env.corsOrigin.split(',').map(origin => origin.trim());
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Rate limiting (more permissive in development)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.isProduction ? 100 : 1000,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // API routes
  app.use('/api', apiRoutes);

  // Telegram webhook endpoint (for production)
  logger.info('Webhook route configuration:', {
    isProduction: env.isProduction,
    webhookDomain: env.telegram.webhookDomain,
    webhookPath: env.telegram.webhookPath,
    shouldRegisterWebhook: env.isProduction && !!env.telegram.webhookDomain,
  });

  if (env.isProduction && env.telegram.webhookDomain) {
    try {
      const bot = getBot();
      app.post(env.telegram.webhookPath, bot.webhookCallback(env.telegram.webhookPath));
      logger.info(`✅ Webhook route registered at: ${env.telegram.webhookPath}`);
    } catch (error) {
      logger.error('❌ Failed to register webhook route:', error);
    }
  } else {
    logger.warn('⚠️  Webhook route NOT registered (using polling mode)');
  }

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
