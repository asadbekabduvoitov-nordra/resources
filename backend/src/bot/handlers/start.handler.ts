import { Markup } from 'telegraf';
import { BotContext } from '../bot';
import { userService, notificationService } from '../../services';
import { logger } from '../../utils/logger';

export async function startHandler(ctx: BotContext): Promise<void> {
  try {
    const telegramUser = ctx.from;

    if (!telegramUser) {
      await ctx.reply('Foydalanuvchi aniqlanmadi.');
      return;
    }

    // Save or update user in database
    const user = await userService.getOrCreateFromTelegram({
      id: telegramUser.id,
      is_bot: telegramUser.is_bot,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
      language_code: telegramUser.language_code,
    });

    logger.info(
      `User started bot: ${user.telegram_id} (@${user.username || 'no_username'}) - DB ID: ${user.id}`
    );

    const welcomeMessage = `
👋 <b>Assalomu alaykum, ${telegramUser.first_name}!</b>

Siz Anora Mahkamova resurslar botiga xush kelibsiz.

Bu yerda barcha o'qituvchilar uchun:
📚 Bepul videodarslar
📄 Amaliy qo'llanmalar va metodik materiallar
🧠 Pedagoglar uchun foydali maslahatlar va tajribalar
🎓 Attestatsiya va sertifikatga tayyorgarlik bo'yicha resurslar joylab boriladi.

Resurslar muntazam yangilanib boriladi. Foydali materiallarni ko'rish uchun pastdagi tugmani bosing.
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📚 Resurslarni ko\'rish', 'view_resources')],
    ]);

    await ctx.reply(welcomeMessage, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    logger.error('Error in start handler:', error);
    await notificationService.notifyBotError(
      error as Error,
      'start_command',
      ctx.from?.id
    );
    await ctx.reply('Xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.');
  }
}
