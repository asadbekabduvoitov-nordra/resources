import { BaseRepository } from './base.repository';
import { CreateUser, UpdateUser, User } from '../models';

export class UserRepository extends BaseRepository<User, CreateUser, UpdateUser> {
  constructor() {
    super('users');
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.handleError(error, 'findByTelegramId');
    }

    return data as User;
  }

  async findActiveUsers(): Promise<User[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .eq('is_blocked', false);

    if (error) {
      this.handleError(error, 'findActiveUsers');
    }

    return (data || []) as User[];
  }

  async upsertByTelegramId(user: CreateUser): Promise<User> {
    const { data, error } = await this.db
      .from(this.tableName)
      .upsert(
        {
          ...user,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as object,
        { onConflict: 'telegram_id' }
      )
      .select()
      .single();

    if (error) {
      this.handleError(error, 'upsertByTelegramId');
    }

    return data as User;
  }

  async updateLastActive(telegramId: number): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .update({
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('telegram_id', telegramId);

    if (error) {
      this.handleError(error, 'updateLastActive');
    }
  }

  async blockUser(telegramId: number): Promise<User> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({ is_blocked: true, updated_at: new Date().toISOString() })
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'blockUser');
    }

    return data as User;
  }

  async unblockUser(telegramId: number): Promise<User> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({ is_blocked: false, updated_at: new Date().toISOString() })
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'unblockUser');
    }

    return data as User;
  }

  async countActiveUsers(): Promise<number> {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_blocked', false);

    if (error) {
      this.handleError(error, 'countActiveUsers');
    }

    return count || 0;
  }
}

export const userRepository = new UserRepository();
