import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../config';
import { DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

export abstract class BaseRepository<TRow, TInsert, TUpdate> {
  protected readonly tableName: string;
  protected readonly db: SupabaseClient;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = supabase;
  }

  protected handleError(error: PostgrestError, operation: string): never {
    logger.error(`Database error in ${operation}: ${error.message}`, {
      code: error.code,
      details: error.details,
    });
    throw new DatabaseError(`${operation} failed: ${error.message}`);
  }

  async findAll(): Promise<TRow[]> {
    const { data, error } = await this.db.from(this.tableName).select('*');

    if (error) {
      this.handleError(error, 'findAll');
    }

    return (data || []) as TRow[];
  }

  async findById(id: string): Promise<TRow | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.handleError(error, 'findById');
    }

    return data as TRow;
  }

  async create(entity: TInsert): Promise<TRow> {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert(entity as object)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create');
    }

    return data as TRow;
  }

  async update(id: string, entity: TUpdate): Promise<TRow> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update(entity as object)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update');
    }

    return data as TRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from(this.tableName).delete().eq('id', id);

    if (error) {
      this.handleError(error, 'delete');
    }
  }
}
