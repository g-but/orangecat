'use client';

import { useCallback, useState } from 'react';
import { API_ROUTES } from '@/config/api-routes';
import { logger } from '@/utils/logger';
import type { CatHealthReport } from '@/services/cat/health-probes';

interface UseCatHealth {
  health: CatHealthReport | null;
  isProbing: boolean;
  /**
   * Fire the live provider probe (GET /api/cat/diagnose). It hits both LLM
   * providers, so call it only when something already looks wrong (an empty
   * result, a failed send) — never on a schedule. Returns the report, or null
   * if the probe itself couldn't run.
   */
  probe: () => Promise<CatHealthReport | null>;
}

/**
 * Client for Cat's health probe — the SSOT for "can Cat answer right now?".
 * Lets any surface that sees a silent empty/failed result ask WHY, and tell an
 * outage apart from a genuinely empty result. The probe endpoint runs
 * independently of the chat orchestrator, so it works even when Cat is down.
 */
export function useCatHealth(): UseCatHealth {
  const [health, setHealth] = useState<CatHealthReport | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  const probe = useCallback(async () => {
    setIsProbing(true);
    try {
      const res = await fetch(API_ROUTES.CAT.DIAGNOSE);
      const json = await res.json().catch(() => null);
      const report = (json?.data ?? null) as CatHealthReport | null;
      setHealth(report);
      return report;
    } catch (err) {
      logger.error('Cat health probe failed', err, 'CatHealth');
      return null;
    } finally {
      setIsProbing(false);
    }
  }, []);

  return { health, isProbing, probe };
}
