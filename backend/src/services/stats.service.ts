import { supabase } from '../config';
import { logger } from '../utils/logger';

export interface DashboardStats {
  totalResources: number;
  activeResources: number;
  totalUsers: number;
  activeUsers: number;
  totalBroadcasts: number;
  recentUsers: number; // Users active in last 7 days
}

export class StatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get resource counts
      const { count: totalResources } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true });

      const { count: activeResources } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get user counts
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_blocked', false);

      // Get users active in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', sevenDaysAgo.toISOString());

      // Get broadcast count
      const { count: totalBroadcasts } = await supabase
        .from('broadcasts')
        .select('*', { count: 'exact', head: true });

      return {
        totalResources: totalResources || 0,
        activeResources: activeResources || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalBroadcasts: totalBroadcasts || 0,
        recentUsers: recentUsers || 0,
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

export const statsService = new StatsService();
