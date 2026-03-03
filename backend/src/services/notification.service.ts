import { env } from '../config';
import { logger } from '../utils/logger';

class NotificationService {
  private botToken: string;
  private devTelegramId: number;

  constructor() {
    this.botToken = env.telegram.botToken;
    this.devTelegramId = env.telegram.devTelegramId;
  }

  async sendErrorToAdmin(error: Error, context?: string): Promise<void> {
    if (!this.devTelegramId) {
      logger.warn('DEV_TELEGRAM_ID not set, skipping error notification');
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const errorMessage = this.formatErrorMessage(error, context, timestamp);

      await this.sendTelegramMessage(this.devTelegramId, errorMessage);
      logger.debug('Error notification sent to admin');
    } catch (sendError) {
      logger.error('Failed to send error notification to admin:', sendError);
    }
  }

  private formatErrorMessage(
    error: Error,
    context?: string,
    timestamp?: string
  ): string {
    const lines = [
      '🚨 <b>Error Alert</b>',
      '',
      `⏰ <b>Time:</b> ${timestamp}`,
      `📍 <b>Context:</b> ${context || 'Unknown'}`,
      `❌ <b>Error:</b> ${this.escapeHtml(error.message)}`,
    ];

    if (error.stack) {
      const stackPreview = error.stack.split('\n').slice(0, 5).join('\n');
      lines.push('', `📜 <b>Stack:</b>\n<code>${this.escapeHtml(stackPreview)}</code>`);
    }

    return lines.join('\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async sendTelegramMessage(
    chatId: number,
    text: string
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.substring(0, 4000), // Telegram message limit
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Telegram API error: ${errorData}`);
    }
  }

  async notifyBotError(error: Error, updateType?: string, userId?: number): Promise<void> {
    const context = [
      'Bot Handler',
      updateType ? `Update: ${updateType}` : null,
      userId ? `User: ${userId}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    await this.sendErrorToAdmin(error, context);
  }

  async notifyApiError(error: Error, method?: string, path?: string): Promise<void> {
    const context = ['API', method, path].filter(Boolean).join(' ');
    await this.sendErrorToAdmin(error, context);
  }

  /**
   * Send a general notification to admin (not an error)
   */
  async notifyAdmin(message: string): Promise<void> {
    if (!this.devTelegramId) {
      logger.warn('DEV_TELEGRAM_ID not set, skipping admin notification');
      return;
    }

    try {
      await this.sendTelegramMessage(this.devTelegramId, message);
      logger.debug('Admin notification sent');
    } catch (error) {
      logger.error('Failed to send admin notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
