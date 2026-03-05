'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authApi } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Refresh token 5 minutes before expiry (access token expires in 1h)
const REFRESH_BEFORE_EXPIRY = 55 * 60 * 1000; // 55 minutes in ms

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Schedule refresh before token expires
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const tokens = await authApi.refresh();
        if (tokens) {
          console.log('Token refreshed automatically');
          // Schedule next refresh
          scheduleTokenRefresh();
        } else {
          // Refresh failed, logout
          setIsAuthenticated(false);
          authApi.clearTokens();
        }
      } catch (error) {
        console.error('Auto refresh failed:', error);
        setIsAuthenticated(false);
        authApi.clearTokens();
      }
    }, REFRESH_BEFORE_EXPIRY);
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await authApi.verify();
        setIsAuthenticated(isValid);

        // If authenticated, schedule token refresh
        if (isValid) {
          scheduleTokenRefresh();
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleTokenRefresh]);

  const login = useCallback(async (password: string) => {
    await authApi.login(password);
    setIsAuthenticated(true);
    // Schedule token refresh after login
    scheduleTokenRefresh();
  }, [scheduleTokenRefresh]);

  const logout = useCallback(() => {
    authApi.logout();
    setIsAuthenticated(false);
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
