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

  if (env.isProduction && env.telegram.webhookDomain) {
    // Use webhook in production
    const webhookUrl = `${env.telegram.webhookDomain}${env.telegram.webhookPath}`;
    await bot.telegram.setWebhook(webhookUrl);
    logger.info(`Bot webhook set to: ${webhookUrl}`);
  } else {
    // Use long polling in development
    await bot.launch();
    logger.info('Bot started with long polling');
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
