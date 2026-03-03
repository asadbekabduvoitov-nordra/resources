import { apiClient } from './client';
import { User, UserQueryParams, PaginatedUsersResponse } from '@/types';

export const usersApi = {
  getAll: async (params?: UserQueryParams): Promise<PaginatedUsersResponse> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    const endpoint = query ? `/users?${query}` : '/users';

    const response = await apiClient.get<PaginatedUsersResponse>(endpoint);
    return response.data || { users: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 50, hasNext: false, hasPrev: false }, stats: { total: 0, active: 0, blocked: 0, inactive: 0 } };
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    if (!response.data) throw new Error('User not found');
    return response.data;
  },

  block: async (id: string): Promise<User> => {
    const response = await apiClient.post<User>(`/users/${id}/block`);
    if (!response.data) throw new Error('Failed to block user');
    return response.data;
  },

  unblock: async (id: string): Promise<User> => {
    const response = await apiClient.post<User>(`/users/${id}/unblock`);
    if (!response.data) throw new Error('Failed to unblock user');
    return response.data;
  },

  sendMessage: async (id: string, message: string): Promise<{ messageId: number }> => {
    const response = await apiClient.post<{ messageId: number }>(`/users/${id}/send-message`, {
      message,
    });
    if (!response.data) throw new Error('Failed to send message');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
