'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { broadcastsApi } from '@/lib/api';
import { Broadcast, CreateBroadcastInput } from '@/types';
import { toast } from 'sonner';

// Polling intervals
const ACTIVE_POLL_INTERVAL = 2000; // 2 seconds when broadcasts are sending
const IDLE_POLL_INTERVAL = 30000; // 30 seconds when no active broadcasts

export function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const fetchBroadcasts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      const data = await broadcastsApi.getAll();
      setBroadcasts(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch broadcasts';
      if (!silent) {
        setError(message);
        toast.error(message);
      }
      return [];
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  // Smart polling - faster when broadcasts are active
  const startPolling = useCallback((data: Broadcast[]) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const hasActive = data.some((b) => b.status === 'sending');
    const interval = hasActive ? ACTIVE_POLL_INTERVAL : IDLE_POLL_INTERVAL;

    isPollingRef.current = true;

    pollingRef.current = setInterval(async () => {
      if (!isPollingRef.current) return;

      const newData = await fetchBroadcasts(true);

      // Check if we need to adjust polling interval
      const stillHasActive = newData.some((b) => b.status === 'sending');

      // If active status changed, restart polling with new interval
      if (hasActive !== stillHasActive) {
        startPolling(newData);
      }
    }, interval);
  }, [fetchBroadcasts]);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts().then((data) => {
      startPolling(data);
    });

    return () => stopPolling();
  }, [fetchBroadcasts, startPolling, stopPolling]);

  const createBroadcast = async (data: CreateBroadcastInput, file?: File) => {
    try {
      const newBroadcast = await broadcastsApi.create(data, file);
      setBroadcasts((prev) => [newBroadcast, ...prev]);
      toast.success('Broadcast created');
      return newBroadcast;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create broadcast';
      toast.error(message);
      throw err;
    }
  };

  const startBroadcast = async (id: string) => {
    try {
      await broadcastsApi.start(id);
      setBroadcasts((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'sending' as const } : b))
      );
      // Start fast polling immediately
      startPolling(broadcasts.map((b) =>
        b.id === id ? { ...b, status: 'sending' as const } : b
      ));
      toast.success('Broadcast started - sending to all users');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start broadcast';
      toast.error(message);
      throw err;
    }
  };

  const cancelBroadcast = async (id: string) => {
    try {
      const cancelled = await broadcastsApi.cancel(id);
      setBroadcasts((prev) => prev.map((b) => (b.id === id ? cancelled : b)));
      toast.success('Broadcast cancelled');
      return cancelled;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel broadcast';
      toast.error(message);
      throw err;
    }
  };

  const deleteBroadcast = async (id: string) => {
    try {
      await broadcastsApi.delete(id);
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      toast.success('Broadcast deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete broadcast';
      toast.error(message);
      throw err;
    }
  };

  // Computed values
  const activeBroadcasts = broadcasts.filter((b) => b.status === 'sending');
  const hasActiveBroadcast = activeBroadcasts.length > 0;

  return {
    broadcasts,
    isLoading,
    error,
    hasActiveBroadcast,
    activeBroadcasts,
    refetch: fetchBroadcasts,
    createBroadcast,
    startBroadcast,
    cancelBroadcast,
    deleteBroadcast,
  };
}
