'use client';

import { useEffect, useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';

/**
 * How many things Cat remembers about the current user. Used to surface Cat's
 * memory where people actually meet Cat (the chat), not only in Settings → AI.
 * Returns 0 until loaded and on any failure — this drives a soft, additive hint,
 * never an error path, so a failed load simply shows nothing.
 */
export function useCatMemoryCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(API_ROUTES.CAT.MEMORIES)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        const memories = json?.data?.memories;
        if (!cancelled && Array.isArray(memories)) {
          setCount(memories.length);
        }
      })
      .catch(() => {
        /* soft hint — silence is fine */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
