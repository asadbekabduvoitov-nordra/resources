import { BotContext } from '../bot';
import { resourceService, notificationService } from '../../services';
import { logger } from '../../utils/logger';
import { Resource } from '../../models';
import { Markup } from 'telegraf';

/**
 * Shows paginated list of resources
 */
export async function showResourcesHandler(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery();

    const page = 1;
    await sendResourcesPage(ctx, page, false);
  } catch (error) {
    logger.error('Error in show resources handler:', error);
    await notificationService.notifyBotError(
      error as Error,
      'show_resources',
      ctx.from?.id
    );
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
}

/**
 * Handles pagination - next/previous page
 */
export async function paginationHandler(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery();

    const callbackData = (ctx.callbackQuery as { data?: string })?.data;
    if (!callbackData) return;

    // Extract page number from callback data: "page_2" -> 2
    const page = parseInt(callbackData.replace('page_', ''), 10);

    if (isNaN(page)) {
      await ctx.answerCbQuery('Noto\'g\'ri sahifa');
      return;
    }

    await sendResourcesPage(ctx, page, true);
  } catch (error) {
    logger.error('Error in pagination handler:', error);
    await notificationService.notifyBotError(
      error as Error,
      'pagination',
      ctx.from?.id
    );
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
}

/**
 * Shows a specific resource
 */
export async function showResourceHandler(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery();

    const callbackData = (ctx.callbackQuery as { data?: string })?.data;
    if (!callbackData) return;

    // Extract resource ID from callback data: "resource_uuid" -> uuid
    const resourceId = callbackData.replace('resource_', '');

    const resource = await resourceService.getResourceById(resourceId);

    await sendResource(ctx, resource);
  } catch (error) {
    logger.error('Error in show resource handler:', error);
    await notificationService.notifyBotError(
      error as Error,
      'show_resource',
      ctx.from?.id
    );

    if ((error as Error).message === 'Resource not found') {
      await ctx.reply('Resurs topilmadi.');
    } else {
      await ctx.reply('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  }
}

/**
 * Back to resources list
 */
export async function backToResourcesHandler(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCbQuery();

    const callbackData = (ctx.callbackQuery as { data?: string })?.data;
    const page = callbackData?.includes('_')
      ? parseInt(callbackData.split('_')[1], 10) || 1
      : 1;

    await sendResourcesPage(ctx, page, false);
  } catch (error) {
    logger.error('Error in back to resources handler:', error);
    await notificationService.notifyBotError(
      error as Error,
      'back_to_resources',
      ctx.from?.id
    );
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
}

/**
 * Helper: Send paginated resources page
 */
async function sendResourcesPage(
  ctx: BotContext,
  page: number,
  edit: boolean
): Promise<void> {
  const { resources, currentPage, totalPages, totalItems, hasNext, hasPrev } =
    await resourceService.getPaginatedResources(page);

  if (resources.length === 0) {
    const message = '📭 Hozircha resurslar mavjud emas.';
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Yangilash', 'view_resources')],
    ]);

    if (edit) {
      await ctx.editMessageText(message, keyboard);
    } else {
      await ctx.reply(message, keyboard);
    }
    return;
  }

  // Build message - only show page info, no list
  const message = `📚 <b>Mavjud resurslar</b>\n\nSahifa: ${currentPage}/${totalPages} (Jami: ${totalItems})`;

  // Build keyboard with resource buttons
  const resourceButtons = resources.map((r) => [
    Markup.button.callback(
      `${getMediaEmoji(r.media_type)} ${truncate(r.title, 30)}`,
      `resource_${r.id}`
    ),
  ]);

  const navigationButtons: ReturnType<typeof Markup.button.callback>[] = [];

  if (hasPrev) {
    navigationButtons.push(
      Markup.button.callback('◀️ Oldingi', `page_${currentPage - 1}`)
    );
  }

  if (hasNext) {
    navigationButtons.push(
      Markup.button.callback('Keyingi ▶️', `page_${currentPage + 1}`)
    );
  }

  const keyboard = Markup.inlineKeyboard([
    ...resourceButtons,
    ...(navigationButtons.length > 0 ? [navigationButtons] : []),
  ]);

  if (edit) {
    await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
  } else {
    await ctx.reply(message, { parse_mode: 'HTML', ...keyboard });
  }
}

/**
 * Helper: Send a single resource with its media (no back button)
 */
async function sendResource(ctx: BotContext, resource: Resource): Promise<void> {
  const caption = formatResourceCaption(resource);

  // Send based on media type - no back button
  switch (resource.media_type) {
    case 'image':
      if (resource.telegram_file_id) {
        await ctx.replyWithPhoto(resource.telegram_file_id, {
          caption,
          parse_mode: 'HTML',
        });
      } else if (resource.media_url) {
        await ctx.replyWithPhoto(resource.media_url, {
          caption,
          parse_mode: 'HTML',
        });
      } else {
        await ctx.reply(caption, { parse_mode: 'HTML' });
      }
      break;

    case 'video':
      if (resource.telegram_file_id) {
        await ctx.replyWithVideo(resource.telegram_file_id, {
          caption,
          parse_mode: 'HTML',
        });
      } else if (resource.media_url) {
        await ctx.replyWithVideo(resource.media_url, {
          caption,
          parse_mode: 'HTML',
        });
      } else {
        await ctx.reply(caption, { parse_mode: 'HTML' });
      }
      break;

    case 'file':
      if (resource.telegram_file_id) {
        await ctx.replyWithDocument(resource.telegram_file_id, {
          caption,
          parse_mode: 'HTML',
        });
      } else if (resource.media_url) {
        await ctx.replyWithDocument(resource.media_url, {
          caption,
          parse_mode: 'HTML',
        });
      } else {
        await ctx.reply(caption, { parse_mode: 'HTML' });
      }
      break;

    case 'none':
    default:
      await ctx.reply(caption, { parse_mode: 'HTML' });
      break;
  }
}

/**
 * Helper: Format resource caption
 */
function formatResourceCaption(resource: Resource): string {
  const lines = [`<b>${resource.title}</b>`];

  if (resource.description) {
    lines.push('', resource.description);
  }

  return lines.join('\n');
}

/**
 * Helper: Get emoji for media type
 */
function getMediaEmoji(mediaType: string): string {
  switch (mediaType) {
    case 'image':
      return '🖼';
    case 'video':
      return '📹';
    case 'file':
      return '📄';
    default:
      return '📝';
  }
}

/**
 * Helper: Truncate text
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
