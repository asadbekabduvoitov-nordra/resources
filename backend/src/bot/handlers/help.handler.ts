import { Markup } from 'telegraf';
import { BotContext } from '../bot';
import { notificationService } from '../../services';
import { logger } from '../../utils/logger';

export async function helpHandler(ctx: BotContext): Promise<void> {
  try {
    const helpMessage = `
📚 <b>Yordam</b>

Bu bot orqali siz turli foydali resurslarni ko'rishingiz mumkin.

<b>Mavjud buyruqlar:</b>
/start - Botni ishga tushirish
/help - Yordam olish

<b>Qanday foydalanish:</b>
1. "Resurslarni ko'rish" tugmasini bosing
2. Ro'yxatdan kerakli resursni tanlang
3. Resurs haqida to'liq ma'lumot oling

Savollar bo'lsa, @ANORAMAHKAMOVA1 kanaliga murojaat qiling!
    `.trim();

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📚 Resurslarni ko\'rish', 'view_resources')],
    ]);

    await ctx.reply(helpMessage, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    logger.error('Error in help handler:', error);
    await notificationService.notifyBotError(
      error as Error,
      'help_command',
      ctx.from?.id
    );
    await ctx.reply('Xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.');
  }
}
