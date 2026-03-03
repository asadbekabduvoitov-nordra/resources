import { BaseRepository } from './base.repository';
import { Broadcast } from '../models';

type CreateBroadcast = {
  message_text?: string | null;
  media_type?: 'image' | 'video' | 'audio' | 'file' | 'none';
  media_url?: string | null;
  telegram_file_id?: string | null;
  total_users?: number;
  sent_count?: number;
  failed_count?: number;
  status?: 'pending' | 'sending' | 'completed' | 'failed';
};

type UpdateBroadcast = Partial<CreateBroadcast> & {
  completed_at?: string | null;
};

export class BroadcastRepository extends BaseRepository<Broadcast, CreateBroadcast, UpdateBroadcast> {
  constructor() {
    super('broadcasts');
  }

  async findAllOrdered(): Promise<Broadcast[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'findAllOrdered');
    }

    return (data || []) as Broadcast[];
  }

  async updateProgress(
    id: string,
    sentCount: number,
    failedCount: number
  ): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
      })
      .eq('id', id);

    if (error) {
      this.handleError(error, 'updateProgress');
    }
  }

  async markCompleted(id: string, sentCount: number, failedCount: number): Promise<Broadcast> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'markCompleted');
    }

    return data as Broadcast;
  }

  async markFailed(id: string, sentCount: number, failedCount: number): Promise<Broadcast> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        status: 'failed',
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'markFailed');
    }

    return data as Broadcast;
  }
}

export const broadcastRepository = new BroadcastRepository();
