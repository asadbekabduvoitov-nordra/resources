import { apiClient } from './client';
import { Broadcast, CreateBroadcastInput } from '@/types';

export const broadcastsApi = {
  getAll: async (): Promise<Broadcast[]> => {
    const response = await apiClient.get<Broadcast[]>('/broadcasts');
    return response.data || [];
  },

  getById: async (id: string): Promise<Broadcast> => {
    const response = await apiClient.get<Broadcast>(`/broadcasts/${id}`);
    if (!response.data) throw new Error('Broadcast not found');
    return response.data;
  },

  create: async (data: CreateBroadcastInput, file?: File): Promise<Broadcast> => {
    const formData = new FormData();

    if (data.message_text) formData.append('message_text', data.message_text);
    formData.append('media_type', data.media_type);
    if (data.media_url) formData.append('media_url', data.media_url);
    if (file) formData.append('media', file);

    const response = await apiClient.post<Broadcast>('/broadcasts', formData);
    if (!response.data) throw new Error('Failed to create broadcast');
    return response.data;
  },

  start: async (id: string): Promise<void> => {
    await apiClient.post(`/broadcasts/${id}/start`);
  },

  cancel: async (id: string): Promise<Broadcast> => {
    const response = await apiClient.post<Broadcast>(`/broadcasts/${id}/cancel`);
    if (!response.data) throw new Error('Failed to cancel broadcast');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/broadcasts/${id}`);
  },
};
