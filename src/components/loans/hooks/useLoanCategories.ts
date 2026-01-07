/**
 * useLoanCategories Hook
 *
 * Hook for loading loan categories.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created loan categories hook
 */

import { useState, useEffect } from 'react';
import loansService from '@/services/loans';
import type { LoanCategory } from '@/types/loans';

export function useLoanCategories(enabled: boolean = true) {
  const [categories, setCategories] = useState<LoanCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {return;}

    let cancelled = false;

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await loansService.getLoanCategories();
        if (!cancelled) {
          if (result.success) {
            setCategories(result.categories || []);
          } else {
            setError(result.error || 'Failed to load categories');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load categories');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { categories, loading, error };
}


