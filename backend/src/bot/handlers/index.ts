import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { BotContext } from '../bot';
import { blockedMiddleware, subscriptionMiddleware } from '../middleware';
import { startHandler } from './start.handler';
import { helpHandler } from './help.handler';
import { checkSubscriptionCallback } from './callback.handler';
import {
  showResourcesHandler,
  showResourceHandler,
  paginationHandler,
  backToResourcesHandler,
} from './resource.handler';

export function registerHandlers(bot: Telegraf<BotContext>): void {
  // Callback handler for subscription check (before middleware)
  bot.action('check_subscription', checkSubscriptionCallback);

  // Apply blocked middleware first - blocks users who are blocked in database
  bot.use(blockedMiddleware);

  // Apply subscription middleware - checks channel subscription
  bot.use(subscriptionMiddleware);

  // Command handlers (protected by both middlewares)
  bot.start(startHandler);
  bot.help(helpHandler);

  // Resource handlers
  bot.action('view_resources', showResourcesHandler);
  bot.action(/^resource_/, showResourceHandler);
  bot.action(/^page_\d+$/, paginationHandler);
  bot.action(/^back_to_resources/, backToResourcesHandler);

  // Handle unknown text messages
  bot.on(message('text'), async (ctx) => {
    await ctx.reply(
      'Noma\'lum buyruq. /help ni bosib yordam oling yoki quyidagi tugmani bosing:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📚 Resurslarni ko\'rish', callback_data: 'view_resources' }],
          ],
        },
      }
    );
  });
}
