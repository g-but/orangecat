import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseEntityListOptions<T = any> {
  apiEndpoint: string;
  userId?: string;
  limit?: number;
  enabled?: boolean;
  queryParams?: Record<string, string | number>;
  /**
   * Optional transform function to convert API response to expected format.
   * Useful when API returns data in a different structure.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformResponse?: (data: any) => { items: T[]; total: number };
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
  options: UseEntityListOptions<T>
): UseEntityListResult<T> {
  const { user } = useAuth();
  const { apiEndpoint, userId, limit = 12, enabled = true, queryParams = {}, transformResponse } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const offset = useMemo(() => (page - 1) * limit, [page, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [total, limit]);

  // Keep a stable ref to the latest queryParams/transformResponse to avoid
  // re-triggering the effect when callers pass new object literals each render.
  const queryParamsRef = useRef(queryParams);
  const transformResponseRef = useRef(transformResponse);
  queryParamsRef.current = queryParams;
  transformResponseRef.current = transformResponse;

  const loadItems = useCallback(async (signal?: AbortSignal) => {
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
          Object.entries(queryParamsRef.current).map(([key, value]) => [key, String(value)])
        ),
      });

      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        cache: 'no-store',
        signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to load items: ${response.statusText}`);
      }

      const data = await response.json();

      // Use custom transformer if provided, otherwise use default structure
      if (transformResponseRef.current) {
        const transformed = transformResponseRef.current(data);
        setItems(transformed.items);
        setTotal(transformed.total);
      } else {
        setItems(data.data || []);
        setTotal(data.metadata?.total || 0);
      }
    } catch (err) {
      // Ignore abort errors — they're intentional (component unmounted or deps changed)
      if (err instanceof Error && err.name === 'AbortError') { return; }
      setError(err instanceof Error ? err.message : 'Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, userId, limit, offset, apiEndpoint]);

  useEffect(() => {
    const controller = new AbortController();
    loadItems(controller.signal);
    return () => controller.abort();
  }, [loadItems]);

  // Memoize items to prevent unnecessary re-renders
  const memoizedItems = useMemo(() => items, [items]);

  const refresh = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  return {
    items: memoizedItems,
    loading,
    error,
    page,
    total,
    totalPages,
    setPage,
    refresh,
  };
}

