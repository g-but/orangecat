'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_ROUTES } from '@/config/api-routes';
import type { CatTrackRecord } from '@/services/cat/track-record';

interface UseCatTrackRecordReturn {
  record: CatTrackRecord | null;
  isLoading: boolean;
}

/**
 * Fetch the user's Cat track record (real outcomes of Cat-created entities).
 * null = signal unavailable (no log access / error) — callers hide the card.
 */
export function useCatTrackRecord(): UseCatTrackRecordReturn {
  const { user } = useAuth();
  const [record, setRecord] = useState<CatTrackRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    async function fetchRecord() {
      try {
        const res = await fetch(API_ROUTES.CAT.TRACK_RECORD);
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (data.success) {
          setRecord(data.data);
        }
      } catch {
        // track record unavailable — card simply doesn't render
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecord();
  }, [user]);

  return { record, isLoading };
}
