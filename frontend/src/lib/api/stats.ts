import { apiClient } from './client';
import { DashboardStats } from '@/types';

export const statsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/stats/dashboard');
    if (!response.data) throw new Error('Failed to fetch stats');
    return response.data;
  },
};
