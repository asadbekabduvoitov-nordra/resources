import { getBot } from '../bot';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface SendMessageResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export class MessageService {
  /**
   * Send a text message to a specific user
   */
  async sendMessageToUser(
    telegramId: number,
    text: string
  ): Promise<SendMessageResult> {
    try {
      const bot = getBot();

      const message = await bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
      });

      logger.info(`Message sent to user ${telegramId}, message_id: ${message.message_id}`);

      return {
        success: true,
        messageId: message.message_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send message to user ${telegramId}:`, error);

      // Check if user blocked the bot
      if (errorMessage.includes('bot was blocked') || errorMessage.includes('user is deactivated')) {
        return {
          success: false,
          error: 'User has blocked the bot or account is deactivated',
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send a message with media to a specific user
   */
  async sendMediaToUser(
    telegramId: number,
    mediaType: 'photo' | 'video' | 'document',
    mediaUrl: string,
    caption?: string
  ): Promise<SendMessageResult> {
    try {
      const bot = getBot();
      let message;

      const options = {
        caption,
        parse_mode: 'HTML' as const,
      };

      switch (mediaType) {
        case 'photo':
          message = await bot.telegram.sendPhoto(telegramId, mediaUrl, options);
          break;
        case 'video':
          message = await bot.telegram.sendVideo(telegramId, mediaUrl, options);
          break;
        case 'document':
          message = await bot.telegram.sendDocument(telegramId, mediaUrl, options);
          break;
      }

      logger.info(`Media sent to user ${telegramId}, message_id: ${message.message_id}`);

      return {
        success: true,
        messageId: message.message_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send media to user ${telegramId}:`, error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const messageService = new MessageService();
