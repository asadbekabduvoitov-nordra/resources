import { Context, MiddlewareFn } from 'telegraf';
import { BotContext } from '../bot';
import { logger } from '../../utils/logger';
import { notificationService } from '../../services';

const REQUIRED_CHANNEL = '@ANORAMAHKAMOVA1';

export const subscriptionMiddleware: MiddlewareFn<BotContext> = async (
  ctx,
  next
) => {
  try {
    const userId = ctx.from?.id;

    if (!userId) {
      return;
    }

    // Check if user is a member of the required channel
    const isSubscribed = await checkSubscription(ctx, userId);

    if (!isSubscribed) {
      await sendSubscriptionRequired(ctx);
      return;
    }

    // User is subscribed, proceed to next handler
    return next();
  } catch (error) {
    logger.error('Error in subscription middleware:', error);
    await notificationService.notifyBotError(
      error as Error,
      'subscription_check',
      ctx.from?.id
    );
    // Allow user to proceed if check fails (fail-open)
    return next();
  }
};

async function checkSubscription(
  ctx: Context,
  userId: number
): Promise<boolean> {
  try {
    const chatMember = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, userId);

    // Valid subscription statuses
    const validStatuses = ['creator', 'administrator', 'member'];

    return validStatuses.includes(chatMember.status);
  } catch (error) {
    logger.error(`Failed to check subscription for user ${userId}:`, error);
    // If we can't check, allow access (fail-open)
    // Change to return false for fail-closed behavior
    return true;
  }
}

async function sendSubscriptionRequired(ctx: Context): Promise<void> {
  const message = `
⚠️ <b>Obuna talab qilinadi!</b>

Botdan foydalanish uchun avval kanalimizga obuna bo'lishingiz kerak:

👉 ${REQUIRED_CHANNEL}

Obuna bo'lgandan so'ng, qaytadan /start bosing.
  `.trim();

  await ctx.reply(message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '📢 Kanalga o\'tish',
            url: `https://t.me/${REQUIRED_CHANNEL.replace('@', '')}`,
          },
        ],
        [
          {
            text: '✅ Obuna bo\'ldim',
            callback_data: 'check_subscription',
          },
        ],
      ],
    },
  });
}
