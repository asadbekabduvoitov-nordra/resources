import { validateEnv, env } from './config';
import { createApp } from './app';
import { startBot, createBot } from './bot';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    // Validate environment variables
    validateEnv();

    // Initialize bot first (needed for webhook setup in app)
    createBot();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    });

    // Start bot
    await startBot();

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();
