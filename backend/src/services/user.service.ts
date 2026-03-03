import { userRepository } from '../repositories';
import { User, CreateUser, UpdateUser, TelegramUser } from '../models';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { supabase } from '../config';

export interface PaginatedUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'blocked' | 'inactive';
  sortBy?: 'created_at' | 'last_active_at' | 'first_name';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsersResult {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    active: number;
    blocked: number;
    inactive: number;
  };
}

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return userRepository.findAll();
  }

  async getPaginatedUsers(params: PaginatedUsersParams): Promise<PaginatedUsersResult> {
    const {
      page = 1,
      limit = 50,
      search = '',
      status = 'all',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from('users').select('*', { count: 'exact' });

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true).eq('is_blocked', false);
    } else if (status === 'blocked') {
      query = query.eq('is_blocked', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,username.ilike.%${search}%,telegram_id.eq.${isNaN(Number(search)) ? 0 : search}`
      );
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching paginated users:', error);
      throw error;
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Get stats (cached or quick query)
    const stats = await this.getUserStats();

    return {
      users: (data || []) as User[],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats,
    };
  }

  async getUserStats(): Promise<{ total: number; active: number; blocked: number; inactive: number }> {
    const [totalResult, activeResult, blockedResult, inactiveResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_blocked', false),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', false),
    ]);

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      blocked: blockedResult.count || 0,
      inactive: inactiveResult.count || 0,
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return user;
  }

  async getUserByTelegramId(telegramId: number): Promise<User | null> {
    return userRepository.findByTelegramId(telegramId);
  }

  async getActiveUsers(): Promise<User[]> {
    return userRepository.findActiveUsers();
  }

  async getActiveUsersCount(): Promise<number> {
    return userRepository.countActiveUsers();
  }

  /**
   * Creates or updates a user from Telegram data.
   * Called when user starts the bot or interacts with it.
   */
  async getOrCreateFromTelegram(telegramUser: TelegramUser): Promise<User> {
    logger.info(`Saving/updating user: ${telegramUser.id} (@${telegramUser.username || 'no_username'})`);

    const user = await userRepository.upsertByTelegramId({
      telegram_id: telegramUser.id,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      username: telegramUser.username || null,
      language_code: telegramUser.language_code || null,
    });

    logger.info(`User saved: ${user.id} (telegram_id: ${user.telegram_id})`);

    return user;
  }

  async updateLastActive(telegramId: number): Promise<void> {
    await userRepository.updateLastActive(telegramId);
  }

  async blockUser(telegramId: number): Promise<User> {
    logger.info(`Blocking user: ${telegramId}`);
    return userRepository.blockUser(telegramId);
  }

  async unblockUser(telegramId: number): Promise<User> {
    logger.info(`Unblocking user: ${telegramId}`);
    return userRepository.unblockUser(telegramId);
  }

  async deactivateUser(id: string): Promise<User> {
    return userRepository.update(id, { is_active: false });
  }

  async activateUser(id: string): Promise<User> {
    return userRepository.update(id, { is_active: true });
  }

  async createUser(userData: CreateUser): Promise<User> {
    logger.info(`Creating user with telegram_id: ${userData.telegram_id}`);
    return userRepository.create(userData);
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User> {
    await this.getUserById(id);
    return userRepository.update(id, userData);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    await userRepository.delete(id);
    logger.info(`User ${id} deleted`);
  }
}

export const userService = new UserService();
