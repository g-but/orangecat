/**
 * useShippingAddresses — CRUD for saved shipping addresses
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShippingAddress } from '@/domain/payments/types';

export function useShippingAddresses() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shipping-addresses');
      const json = await res.json();
      if (res.ok && json.success) {
        setAddresses(json.data);
      }
    } catch {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = useCallback(
    async (address: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const res = await fetch('/api/shipping-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAddresses();
        return json.data as ShippingAddress;
      }
      throw new Error(json.error?.message || 'Failed to create address');
    },
    [fetchAddresses]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      await fetch(`/api/shipping-addresses/${id}`, { method: 'DELETE' });
      await fetchAddresses();
    },
    [fetchAddresses]
  );

  const defaultAddress = addresses.find(a => a.is_default) || addresses[0] || null;

  return {
    addresses,
    defaultAddress,
    loading,
    error,
    createAddress,
    deleteAddress,
    refetch: fetchAddresses,
  };
}
