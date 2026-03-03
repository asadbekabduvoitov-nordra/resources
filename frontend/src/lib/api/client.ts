import { siteConfig } from '@/config';
import { ApiResponse } from '@/types';
import { authApi } from './auth';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = siteConfig.apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get auth token
    const token = authApi.getAccessToken();

    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    // Add auth header if token exists
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }

    let response = await fetch(url, config);

    // If unauthorized, try to refresh token
    if (response.status === 401 && token) {
      const refreshed = await authApi.refresh();

      if (refreshed) {
        // Retry with new token
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${refreshed.accessToken}`,
        };
        response = await fetch(url, config);
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: 'An error occurred' },
      }));

      // Handle auth errors
      if (response.status === 401) {
        authApi.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw new Error(error.error?.message || 'Request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, { method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: object | FormData
  ): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<ApiResponse<T>>(endpoint, { method: 'POST', body });
  }

  async put<T>(
    endpoint: string,
    data?: object | FormData
  ): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<ApiResponse<T>>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(
    endpoint: string,
    data?: object
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
