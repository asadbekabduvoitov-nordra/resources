import { MiddlewareFn } from 'telegraf';
import { BotContext } from '../bot';
import { userService } from '../../services';
import { logger } from '../../utils/logger';

export const blockedMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  try {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      return;
    }

    // Check if user exists and is blocked
    const user = await userService.getUserByTelegramId(telegramId);

    if (user?.is_blocked) {
      logger.info(`Blocked user ${telegramId} tried to access the bot`);

      await ctx.reply(
        '⛔ Sizning hisobingiz bloklangan.\n\nAgar bu xato deb hisoblasangiz, administrator bilan bog\'laning.',
        { parse_mode: 'HTML' }
      );

      return; // Don't proceed to next middleware
    }

    // User is not blocked, proceed
    return next();
  } catch (error) {
    logger.error('Error in blocked middleware:', error);
    // On error, allow access (fail-open)
    return next();
  }
};
