/**
 * useAssets Hook
 *
 * Hook for loading user assets for collateral selection.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created assets hook
 */

import { useState, useEffect } from 'react';
import type { AssetOption } from '../types';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

export function useAssets(enabled: boolean = true) {
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(ENTITY_REGISTRY.asset.apiEndpoint, { credentials: 'include' });
        if (!res.ok) {
          throw new Error('Failed to load assets');
        }
        const json = await res.json();
        if (!cancelled) {
          const items = (json.data || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            estimated_value: a.estimated_value ?? null,
            currency: a.currency || 'USD',
            verification_status: a.verification_status || 'unverified',
          }));
          setAssets(items);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load assets');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const refreshAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(ENTITY_REGISTRY.asset.apiEndpoint, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const items = (json.data || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          estimated_value: a.estimated_value ?? null,
          currency: a.currency || 'USD',
          verification_status: a.verification_status || 'unverified',
        }));
        setAssets(items);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh assets');
    } finally {
      setLoading(false);
    }
  };

  return { assets, loading, error, refreshAssets };
}
