import { BaseRepository } from './base.repository';
import { CreateResource, UpdateResource, Resource } from '../models';

export class ResourceRepository extends BaseRepository<Resource, CreateResource, UpdateResource> {
  constructor() {
    super('resources');
  }

  async findActive(): Promise<Resource[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'findActive');
    }

    return (data || []) as Resource[];
  }

  async findActivePaginated(
    page: number,
    limit: number
  ): Promise<{ resources: Resource[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      this.handleError(countError, 'findActivePaginated:count');
    }

    // Get paginated data
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleError(error, 'findActivePaginated');
    }

    return {
      resources: (data || []) as Resource[],
      total: count || 0,
    };
  }

  async findActiveById(id: string): Promise<Resource | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.handleError(error, 'findActiveById');
    }

    return data as Resource;
  }
}

export const resourceRepository = new ResourceRepository();
