'use client';

import { useState, useEffect, useCallback } from 'react';
import { resourcesApi } from '@/lib/api';
import { Resource, CreateResourceInput, UpdateResourceInput } from '@/types';
import { toast } from 'sonner';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await resourcesApi.getAll();
      setResources(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch resources';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const createResource = async (data: CreateResourceInput, file?: File) => {
    try {
      const newResource = await resourcesApi.create(data, file);
      setResources((prev) => [newResource, ...prev]);
      toast.success('Resource created successfully');
      return newResource;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create resource';
      toast.error(message);
      throw err;
    }
  };

  const updateResource = async (id: string, data: UpdateResourceInput, file?: File) => {
    try {
      const updatedResource = await resourcesApi.update(id, data, file);
      setResources((prev) =>
        prev.map((r) => (r.id === id ? updatedResource : r))
      );
      toast.success('Resource updated successfully');
      return updatedResource;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update resource';
      toast.error(message);
      throw err;
    }
  };

  const deleteResource = async (id: string) => {
    try {
      await resourcesApi.delete(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      toast.success('Resource deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete resource';
      toast.error(message);
      throw err;
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const updatedResource = await resourcesApi.toggleActive(id);
      setResources((prev) =>
        prev.map((r) => (r.id === id ? updatedResource : r))
      );
      toast.success(
        updatedResource.is_active ? 'Resource activated' : 'Resource deactivated'
      );
      return updatedResource;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle resource';
      toast.error(message);
      throw err;
    }
  };

  return {
    resources,
    isLoading,
    error,
    refetch: fetchResources,
    createResource,
    updateResource,
    deleteResource,
    toggleActive,
  };
}
