import { siteConfig } from '@/config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

const TOKEN_KEY = 'resurs_access_token';
const REFRESH_TOKEN_KEY = 'resurs_refresh_token';

class AuthApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = siteConfig.apiUrl;
  }

  async login(password: string): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data: ApiResponse<AuthTokens> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Login failed');
    }

    if (data.data) {
      this.setTokens(data.data);
    }

    return data.data!;
  }

  async refresh(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data: ApiResponse<AuthTokens> = await response.json();

      if (!response.ok || !data.success) {
        this.clearTokens();
        return null;
      }

      if (data.data) {
        this.setTokens(data.data);
      }

      return data.data || null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  async verify(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) return true;

      // Token might be expired, try to refresh
      if (response.status === 401) {
        const refreshed = await this.refresh();
        return !!refreshed;
      }

      return false;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.clearTokens();
  }

  // Token management
  setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authApi = new AuthApi();
