import { broadcastRepository, userRepository } from '../repositories';
import { Broadcast } from '../models';
import { getBot } from '../bot';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { supabase } from '../config';

export interface BroadcastRequest {
  message_text?: string;
  media_type: 'image' | 'video' | 'audio' | 'file' | 'none';
  media_url?: string;
}

interface SendResult {
  success: boolean;
  telegramId: number;
  fileId?: string;
  error?: string;
  shouldDeactivate?: boolean;
}

// Configuration for optimal Telegram broadcasting
const BROADCAST_CONFIG = {
  // Telegram allows ~30 messages/second, we use 25 to be safe
  MESSAGES_PER_SECOND: 25,
  // Number of concurrent promises
  CONCURRENCY: 25,
  // Batch size for fetching users from DB
  USER_BATCH_SIZE: 1000,
  // Progress update frequency
  PROGRESS_UPDATE_INTERVAL: 50,
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 5000], // ms
  // Delay between batches (ms)
  BATCH_DELAY: 1000,
};

class BroadcastService {
  private activeBroadcasts: Map<string, { active: boolean; fileId?: string }> = new Map();

  async getAllBroadcasts(): Promise<Broadcast[]> {
    return broadcastRepository.findAllOrdered();
  }

  async getBroadcastById(id: string): Promise<Broadcast | null> {
    return broadcastRepository.findById(id);
  }

  async createBroadcast(data: BroadcastRequest): Promise<Broadcast> {
    const totalUsers = await userRepository.countActiveUsers();

    const broadcast = await broadcastRepository.create({
      message_text: data.message_text || null,
      media_type: data.media_type,
      media_url: data.media_url || null,
      total_users: totalUsers,
      sent_count: 0,
      failed_count: 0,
      status: 'pending',
    });

    return broadcast;
  }

  async startBroadcast(broadcastId: string): Promise<void> {
    const broadcast = await broadcastRepository.findById(broadcastId);

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    if (broadcast.status !== 'pending') {
      throw new Error('Broadcast is not in pending status');
    }

    // Update total users count (might have changed since creation)
    const totalUsers = await userRepository.countActiveUsers();
    await broadcastRepository.update(broadcastId, {
      status: 'sending',
      total_users: totalUsers,
    });

    this.activeBroadcasts.set(broadcastId, { active: true });

    // Start optimized broadcast in background
    this.executeBroadcast(broadcastId, broadcast).catch((error) => {
      logger.error(`Broadcast ${broadcastId} failed with error:`, error);
      notificationService.notifyBotError(error, 'broadcast_execution', undefined);
      this.finalizeBroadcast(broadcastId, 0, 0, true);
    });
  }

  async cancelBroadcast(broadcastId: string): Promise<Broadcast> {
    const state = this.activeBroadcasts.get(broadcastId);
    if (state) {
      state.active = false;
    }

    const broadcast = await broadcastRepository.findById(broadcastId);
    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    return broadcastRepository.markFailed(
      broadcastId,
      broadcast.sent_count,
      broadcast.failed_count
    );
  }

  async deleteBroadcast(id: string): Promise<void> {
    const state = this.activeBroadcasts.get(id);
    if (state) {
      state.active = false;
      this.activeBroadcasts.delete(id);
    }

    await broadcastRepository.delete(id);
  }

  /**
   * Main broadcast execution with optimizations
   */
  private async executeBroadcast(broadcastId: string, broadcast: Broadcast): Promise<void> {
    const bot = getBot();
    const telegram = bot.telegram;

    let sentCount = 0;
    let failedCount = 0;
    let offset = 0;
    let cachedFileId: string | undefined;
    const usersToDeactivate: number[] = [];

    logger.info(`Starting optimized broadcast ${broadcastId}`);

    while (true) {
      // Check if cancelled
      const state = this.activeBroadcasts.get(broadcastId);
      if (!state?.active) {
        logger.info(`Broadcast ${broadcastId} was cancelled`);
        break;
      }

      // Fetch users in batches using cursor pagination
      const users = await this.fetchUserBatch(offset, BROADCAST_CONFIG.USER_BATCH_SIZE);

      if (users.length === 0) {
        break; // No more users
      }

      logger.info(`Processing batch: offset=${offset}, users=${users.length}`);

      // Process batch with concurrency control
      const results = await this.processBatchWithConcurrency(
        users,
        telegram,
        broadcast,
        cachedFileId,
        broadcastId
      );

      // Process results
      for (const result of results) {
        if (result.success) {
          sentCount++;
          // Cache the file_id from first successful send
          if (!cachedFileId && result.fileId) {
            cachedFileId = result.fileId;
            // Store in broadcast state for reuse
            const currentState = this.activeBroadcasts.get(broadcastId);
            if (currentState) {
              currentState.fileId = cachedFileId;
            }
            logger.info(`Cached file_id for broadcast ${broadcastId}`);
          }
        } else {
          failedCount++;
          if (result.shouldDeactivate) {
            usersToDeactivate.push(result.telegramId);
          }
        }
      }

      // Update progress
      await broadcastRepository.updateProgress(broadcastId, sentCount, failedCount);

      // Move to next batch
      offset += users.length;

      // Delay between batches to respect rate limits
      await this.delay(BROADCAST_CONFIG.BATCH_DELAY);
    }

    // Deactivate users who blocked the bot
    if (usersToDeactivate.length > 0) {
      await this.deactivateUsers(usersToDeactivate);
      logger.info(`Deactivated ${usersToDeactivate.length} users who blocked the bot`);
    }

    // Finalize broadcast
    await this.finalizeBroadcast(broadcastId, sentCount, failedCount, false);
  }

  /**
   * Fetch users in batches using offset pagination
   */
  private async fetchUserBatch(offset: number, limit: number): Promise<{ telegram_id: number }[]> {
    const { data, error } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('is_active', true)
      .eq('is_blocked', false)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching user batch:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Process a batch of users with concurrency control
   */
  private async processBatchWithConcurrency(
    users: { telegram_id: number }[],
    telegram: ReturnType<typeof getBot>['telegram'],
    broadcast: Broadcast,
    cachedFileId: string | undefined,
    broadcastId: string
  ): Promise<SendResult[]> {
    const results: SendResult[] = [];
    const queue = [...users];
    const activePromises: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      while (queue.length > 0) {
        // Check if cancelled
        const state = this.activeBroadcasts.get(broadcastId);
        if (!state?.active) {
          return;
        }

        const user = queue.shift();
        if (!user) return;

        const result = await this.sendToUserWithRetry(
          telegram,
          user.telegram_id,
          broadcast,
          cachedFileId || state.fileId
        );
        results.push(result);

        // Small delay between sends to respect rate limit
        await this.delay(1000 / BROADCAST_CONFIG.MESSAGES_PER_SECOND);
      }
    };

    // Start concurrent workers
    for (let i = 0; i < BROADCAST_CONFIG.CONCURRENCY; i++) {
      activePromises.push(processNext());
    }

    await Promise.all(activePromises);

    return results;
  }

  /**
   * Send message to a user with retry logic
   */
  private async sendToUserWithRetry(
    telegram: ReturnType<typeof getBot>['telegram'],
    telegramId: number,
    broadcast: Broadcast,
    cachedFileId?: string
  ): Promise<SendResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= BROADCAST_CONFIG.MAX_RETRIES; attempt++) {
      try {
        const fileId = await this.sendMessageToUser(telegram, telegramId, broadcast, cachedFileId);
        return {
          success: true,
          telegramId,
          fileId,
        };
      } catch (error) {
        lastError = error as Error;
        const errorMessage = lastError.message.toLowerCase();

        // Don't retry for permanent errors
        if (this.isPermanentError(errorMessage)) {
          return {
            success: false,
            telegramId,
            error: lastError.message,
            shouldDeactivate: this.shouldDeactivateUser(errorMessage),
          };
        }

        // Wait before retry (exponential backoff)
        if (attempt < BROADCAST_CONFIG.MAX_RETRIES) {
          await this.delay(BROADCAST_CONFIG.RETRY_DELAYS[attempt] || 5000);
        }
      }
    }

    return {
      success: false,
      telegramId,
      error: lastError?.message || 'Unknown error',
    };
  }

  /**
   * Send a single message to a user
   */
  private async sendMessageToUser(
    telegram: ReturnType<typeof getBot>['telegram'],
    telegramId: number,
    broadcast: Broadcast,
    cachedFileId?: string
  ): Promise<string | undefined> {
    const { message_text, media_type, media_url } = broadcast;

    const options = {
      caption: message_text || undefined,
      parse_mode: 'HTML' as const,
    };

    // Use cached file_id if available (much faster)
    const mediaSource = cachedFileId || media_url;

    let message;

    switch (media_type) {
      case 'image':
        if (mediaSource) {
          message = await telegram.sendPhoto(telegramId, mediaSource, options);
          // Return file_id for caching
          return message.photo?.[message.photo.length - 1]?.file_id;
        } else if (message_text) {
          await telegram.sendMessage(telegramId, message_text, { parse_mode: 'HTML' });
        }
        break;

      case 'video':
        if (mediaSource) {
          message = await telegram.sendVideo(telegramId, mediaSource, options);
          return message.video?.file_id;
        } else if (message_text) {
          await telegram.sendMessage(telegramId, message_text, { parse_mode: 'HTML' });
        }
        break;

      case 'audio':
        if (mediaSource) {
          message = await telegram.sendAudio(telegramId, mediaSource, options);
          return message.audio?.file_id;
        } else if (message_text) {
          await telegram.sendMessage(telegramId, message_text, { parse_mode: 'HTML' });
        }
        break;

      case 'file':
        if (mediaSource) {
          message = await telegram.sendDocument(telegramId, mediaSource, options);
          return message.document?.file_id;
        } else if (message_text) {
          await telegram.sendMessage(telegramId, message_text, { parse_mode: 'HTML' });
        }
        break;

      case 'none':
      default:
        if (message_text) {
          await telegram.sendMessage(telegramId, message_text, { parse_mode: 'HTML' });
        }
        break;
    }

    return undefined;
  }

  /**
   * Check if error is permanent (no retry needed)
   */
  private isPermanentError(errorMessage: string): boolean {
    const permanentErrors = [
      'bot was blocked',
      'user is deactivated',
      'chat not found',
      'bot was kicked',
      'have no rights to send',
      'need administrator rights',
      'peer_id_invalid',
      'user_is_bot',
    ];
    return permanentErrors.some((err) => errorMessage.includes(err));
  }

  /**
   * Check if user should be marked as inactive
   */
  private shouldDeactivateUser(errorMessage: string): boolean {
    const deactivateErrors = [
      'bot was blocked',
      'user is deactivated',
      'chat not found',
      'bot was kicked',
    ];
    return deactivateErrors.some((err) => errorMessage.includes(err));
  }

  /**
   * Bulk deactivate users who blocked the bot
   */
  private async deactivateUsers(telegramIds: number[]): Promise<void> {
    if (telegramIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('telegram_id', telegramIds);

      if (error) {
        logger.error('Error deactivating users:', error);
      }
    } catch (error) {
      logger.error('Error in bulk deactivate:', error);
    }
  }

  /**
   * Finalize broadcast (mark as completed or failed)
   */
  private async finalizeBroadcast(
    broadcastId: string,
    sentCount: number,
    failedCount: number,
    failed: boolean
  ): Promise<void> {
    this.activeBroadcasts.delete(broadcastId);

    if (failed) {
      await broadcastRepository.markFailed(broadcastId, sentCount, failedCount);
      logger.info(`Broadcast ${broadcastId} failed: ${sentCount} sent, ${failedCount} failed`);
    } else {
      await broadcastRepository.markCompleted(broadcastId, sentCount, failedCount);
      logger.info(`Broadcast ${broadcastId} completed: ${sentCount} sent, ${failedCount} failed`);
    }

    // Notify admin about completion
    const successRate = sentCount + failedCount > 0
      ? ((sentCount / (sentCount + failedCount)) * 100).toFixed(1)
      : '0';

    await notificationService.notifyAdmin(
      `📊 Broadcast #${broadcastId.slice(0, 8)} ${failed ? 'failed' : 'completed'}!\n\n` +
      `✅ Sent: ${sentCount}\n` +
      `❌ Failed: ${failedCount}\n` +
      `📈 Success rate: ${successRate}%`
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const broadcastService = new BroadcastService();
