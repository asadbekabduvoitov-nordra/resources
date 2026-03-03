import { BotContext } from '../bot';
import { notificationService } from '../../services';
import { logger } from '../../utils/logger';

const REQUIRED_CHANNEL = '@ANORAMAHKAMOVA1';

export async function checkSubscriptionCallback(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.answerCbQuery('Foydalanuvchi aniqlanmadi');
      return;
    }

    // Check subscription status
    const chatMember = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, userId);
    const validStatuses = ['creator', 'administrator', 'member'];
    const isSubscribed = validStatuses.includes(chatMember.status);

    if (isSubscribed) {
      await ctx.answerCbQuery('✅ Obuna tasdiqlandi!');
      await ctx.deleteMessage().catch(() => {});

      // Send welcome message
      const welcomeMessage = `
✅ <b>Obuna tasdiqlandi!</b>

Botdan foydalanishingiz mumkin.

/start - Boshlash
/help - Yordam
      `.trim();

      await ctx.reply(welcomeMessage, { parse_mode: 'HTML' });
    } else {
      await ctx.answerCbQuery('❌ Siz hali obuna bo\'lmagansiz!', {
        show_alert: true,
      });
    }
  } catch (error) {
    logger.error('Error in check subscription callback:', error);
    await notificationService.notifyBotError(
      error as Error,
      'check_subscription_callback',
      ctx.from?.id
    );
    await ctx.answerCbQuery('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
}
