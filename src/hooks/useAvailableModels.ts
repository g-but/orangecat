'use client';

import { useEffect, useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';
import type { ModelAccess } from '@/services/cat/model-access';

/**
 * Fetches the models the current user can actually use, from the access SSOT
 * (`GET /api/user/available-models`). While loading — or if the user is signed
 * out / the call fails — callers fall back to the free pool, so the picker is
 * never empty and never fake-enabled.
 */
export function useAvailableModels(): { access: ModelAccess | null; loading: boolean } {
  const [access, setAccess] = useState<ModelAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(API_ROUTES.USER.AVAILABLE_MODELS);
        if (!res.ok) {
          return;
        }
        const body = (await res.json()) as { data?: ModelAccess };
        if (alive && body.data) {
          setAccess(body.data);
        }
      } catch {
        // signed out / offline → stay on the free-pool fallback
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { access, loading };
}
