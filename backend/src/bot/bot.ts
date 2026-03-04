import { Telegraf, Context } from 'telegraf';
import { env } from '../config';
import { logger } from '../utils/logger';
import { notificationService } from '../services';
import { registerHandlers } from './handlers';

export interface BotContext extends Context {
  // Add custom context properties here
}

let botInstance: Telegraf<BotContext> | null = null;

export function createBot(): Telegraf<BotContext> {
  if (botInstance) {
    return botInstance;
  }

  botInstance = new Telegraf<BotContext>(env.telegram.botToken);

  // Register all handlers
  registerHandlers(botInstance);

  // Error handling
  botInstance.catch((err, ctx) => {
    logger.error(`Bot error for ${ctx.updateType}:`, err);

    // Send error notification to developer
    notificationService
      .notifyBotError(err as Error, ctx.updateType, ctx.from?.id)
      .catch(() => {});
  });

  return botInstance;
}

export function getBot(): Telegraf<BotContext> {
  if (!botInstance) {
    throw new Error('Bot has not been initialized. Call createBot() first.');
  }
  return botInstance;
}

export async function startBot(): Promise<void> {
  const bot = createBot();

  // Log environment info for debugging
  logger.info('Bot startup configuration:', {
    nodeEnv: env.nodeEnv,
    isProduction: env.isProduction,
    webhookDomain: env.telegram.webhookDomain,
    webhookPath: env.telegram.webhookPath,
  });

  if (env.isProduction && env.telegram.webhookDomain) {
    // Use webhook in production
    const webhookUrl = `${env.telegram.webhookDomain}${env.telegram.webhookPath}`;

    logger.info(`Setting webhook to: ${webhookUrl}`);

    try {
      // Delete any existing webhook first, dropping pending updates to avoid duplicate messages
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });

      // Set the new webhook
      await bot.telegram.setWebhook(webhookUrl);

      // Verify webhook was set
      const webhookInfo = await bot.telegram.getWebhookInfo();
      logger.info('Webhook configured successfully:', {
        url: webhookInfo.url,
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
      });
    } catch (error) {
      logger.error('Failed to set webhook:', error);
      throw error;
    }
  } else {
    // Use long polling in development
    logger.info('Starting bot with long polling mode');

    try {
      // Make sure no webhook is set
      await bot.telegram.deleteWebhook({ drop_pending_updates: false });
      await bot.launch();
      logger.info('Bot started with long polling');
    } catch (error) {
      logger.error('Failed to start bot in polling mode:', error);
      throw error;
    }
  }

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export async function stopBot(): Promise<void> {
  if (botInstance) {
    botInstance.stop();
    botInstance = null;
    logger.info('Bot stopped');
  }
}
