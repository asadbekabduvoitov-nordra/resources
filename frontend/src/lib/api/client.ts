import { siteConfig } from '@/config';
import { ApiResponse } from '@/types';
import { authApi } from './auth';

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

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

    // If unauthorized, try to refresh token once
    if (response.status === 401 && token) {
      const refreshSucceeded = await this.handleTokenRefresh();

      if (refreshSucceeded) {
        // Retry with new token
        const newToken = authApi.getAccessToken();
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${newToken}`,
        };
        response = await fetch(url, config);
      } else {
        // Refresh failed, clear tokens and redirect to login
        authApi.clearTokens();
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

      // Handle auth errors after retry
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

  /**
   * Handle token refresh with promise caching to prevent multiple simultaneous refreshes
   */
  private async handleTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start new refresh
    this.isRefreshing = true;
    this.refreshPromise = authApi
      .refresh()
      .then((tokens) => {
        this.isRefreshing = false;
        this.refreshPromise = null;
        return !!tokens;
      })
      .catch(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
        return false;
      });

    return this.refreshPromise;
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
