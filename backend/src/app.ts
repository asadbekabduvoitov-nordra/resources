import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config';
import { apiRoutes } from './routes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';
import { getBot } from './bot';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.isProduction
        ? 'https://your-domain.com'
        : ['http://localhost:3001', 'http://127.0.0.1:3001'],
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
  if (env.isProduction && env.telegram.webhookDomain) {
    const bot = getBot();
    app.use(env.telegram.webhookPath, bot.webhookCallback(env.telegram.webhookPath));
  }

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
