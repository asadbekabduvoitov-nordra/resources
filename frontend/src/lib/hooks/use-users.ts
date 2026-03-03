'use client';

import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import { User, UserQueryParams, UserPagination, UserStats, UserStatus, UserSortBy, SortOrder } from '@/types';
import { toast } from 'sonner';

const DEFAULT_LIMIT = 50;

export function useUsers(initialParams?: UserQueryParams) {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<UserPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: DEFAULT_LIMIT,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    blocked: 0,
    inactive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query params state
  const [queryParams, setQueryParams] = useState<UserQueryParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...initialParams,
  });

  const fetchUsers = useCallback(async (params?: UserQueryParams) => {
    const finalParams = params || queryParams;
    try {
      setIsLoading(true);
      setError(null);
      const result = await usersApi.getAll(finalParams);
      setUsers(result.users);
      setPagination(result.pagination);
      setStats(result.stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchUsers(queryParams);
  }, [queryParams, fetchUsers]);

  // Pagination controls
  const goToPage = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.currentPage + 1);
    }
  }, [pagination.hasNext, pagination.currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      goToPage(pagination.currentPage - 1);
    }
  }, [pagination.hasPrev, pagination.currentPage, goToPage]);

  // Filters
  const setSearch = useCallback((search: string) => {
    setQueryParams((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setStatus = useCallback((status: UserStatus) => {
    setQueryParams((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: UserSortBy, sortOrder: SortOrder) => {
    setQueryParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  // Actions
  const blockUser = async (id: string) => {
    try {
      const updatedUser = await usersApi.block(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? updatedUser : u))
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        active: prev.active - 1,
        blocked: prev.blocked + 1,
      }));
      toast.success('User blocked');
      return updatedUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to block user';
      toast.error(message);
      throw err;
    }
  };

  const unblockUser = async (id: string) => {
    try {
      const updatedUser = await usersApi.unblock(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? updatedUser : u))
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        active: prev.active + 1,
        blocked: prev.blocked - 1,
      }));
      toast.success('User unblocked');
      return updatedUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unblock user';
      toast.error(message);
      throw err;
    }
  };

  const sendMessage = async (id: string, message: string) => {
    try {
      const result = await usersApi.sendMessage(id, message);
      toast.success('Message sent');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(errorMsg);
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      // Update stats
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
      toast.success('User deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
      throw err;
    }
  };

  return {
    // Data
    users,
    pagination,
    stats,
    isLoading,
    error,
    queryParams,

    // Pagination
    goToPage,
    nextPage,
    prevPage,

    // Filters
    setSearch,
    setStatus,
    setSort,
    setLimit,

    // Actions
    refetch: () => fetchUsers(queryParams),
    blockUser,
    unblockUser,
    sendMessage,
    deleteUser,
  };
}
