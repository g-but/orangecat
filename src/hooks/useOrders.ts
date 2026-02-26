/**
 * useOrders — Fetch and manage orders
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/domain/payments/types';

interface UseOrdersOptions {
  role?: 'buyer' | 'seller';
  status?: string;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { role = 'buyer', status } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ role });
      if (status) {
        params.set('status', status);
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setOrders(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch orders');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [role, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
