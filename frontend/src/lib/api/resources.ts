import { apiClient } from './client';
import { Resource, CreateResourceInput, UpdateResourceInput, UploadResult } from '@/types';

export const resourcesApi = {
  getAll: async (): Promise<Resource[]> => {
    const response = await apiClient.get<Resource[]>('/resources');
    return response.data || [];
  },

  getById: async (id: string): Promise<Resource> => {
    const response = await apiClient.get<Resource>(`/resources/${id}`);
    if (!response.data) throw new Error('Resource not found');
    return response.data;
  },

  create: async (data: CreateResourceInput, file?: File): Promise<Resource> => {
    if (file) {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.telegram_file_id) formData.append('telegram_file_id', data.telegram_file_id);
      formData.append('file', file);

      const response = await apiClient.post<Resource>('/resources', formData);
      if (!response.data) throw new Error('Failed to create resource');
      return response.data;
    }

    const response = await apiClient.post<Resource>('/resources', data);
    if (!response.data) throw new Error('Failed to create resource');
    return response.data;
  },

  update: async (id: string, data: UpdateResourceInput, file?: File): Promise<Resource> => {
    if (file) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.telegram_file_id) formData.append('telegram_file_id', data.telegram_file_id);
      if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
      formData.append('file', file);

      const response = await apiClient.put<Resource>(`/resources/${id}`, formData);
      if (!response.data) throw new Error('Failed to update resource');
      return response.data;
    }

    const response = await apiClient.put<Resource>(`/resources/${id}`, data);
    if (!response.data) throw new Error('Failed to update resource');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/resources/${id}`);
  },

  toggleActive: async (id: string): Promise<Resource> => {
    const response = await apiClient.patch<Resource>(`/resources/${id}/toggle`);
    if (!response.data) throw new Error('Failed to toggle resource');
    return response.data;
  },

  uploadFile: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResult>('/resources/upload', formData);
    if (!response.data) throw new Error('Failed to upload file');
    return response.data;
  },
};
