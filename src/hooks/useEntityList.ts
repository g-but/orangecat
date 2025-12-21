import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * useEntityList - Reusable hook for fetching and managing entity lists
 * 
 * Features:
 * - Automatic pagination
 * - Loading and error states
 * - Type-safe
 * - DRY principle - single source of truth for data fetching
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Initial creation of reusable entity list hook
 */

export interface UseEntityListOptions {
  apiEndpoint: string;
  userId?: string;
  limit?: number;
  enabled?: boolean;
  queryParams?: Record<string, string | number>;
}

export interface UseEntityListResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export function useEntityList<T extends { id: string }>(
  options: UseEntityListOptions
): UseEntityListResult<T> {
  const { user } = useAuth();
  const { apiEndpoint, userId, limit = 12, enabled = true, queryParams = {} } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const offset = useMemo(() => (page - 1) * limit, [page, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [total, limit]);

  const loadItems = async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams({
        ...(userId && { user_id: userId }),
        limit: limit.toString(),
        offset: offset.toString(),
        ...Object.fromEntries(
          Object.entries(queryParams).map(([key, value]) => [key, String(value)])
        ),
      });

      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load items: ${response.statusText}`);
      }

      const data = await response.json();
      setItems(data.data || []);
      setTotal(data.metadata?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, page, limit, enabled, apiEndpoint, offset]);

  const refresh = async () => {
    await loadItems();
  };

  return {
    items,
    loading,
    error,
    page,
    total,
    totalPages,
    setPage,
    refresh,
  };
}

