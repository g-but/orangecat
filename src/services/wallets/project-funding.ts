/**
 * Project funding enrichment — attach HONEST settled-ledger funding figures to
 * project rows on list surfaces (search, trending, profile tabs, favorites,
 * dashboards).
 *
 * `projects.raised_amount` is a dead column no code ever writes: any UI reading
 * it shows 0 regardless of real funding. This helper overwrites it with the
 * settled `contributions` total converted into the project's own currency (the
 * unit every consumer already assumes for progress math), and adds the BTC
 * figure plus the settled contributor count — all from ONE batch RPC.
 *
 * Isomorphic: safe from both server routes and the browser search client (the
 * RPC is granted to anon, and the currency converter caches rates in-process).
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { currencyConverter, convertBtcTo } from '@/services/currency';
import { logger } from '@/utils/logger';
import { getEntitiesFundingStats } from './funding-stats';

export interface SettledProjectFunding {
  /** Settled total in the project's own currency — replaces the dead column. */
  raised_amount: number;
  /** Settled total in BTC, the canonical unit, for viewer-currency display. */
  settled_raised_btc: number;
  /** Number of settled contributions — the honest "supporters" figure. */
  supporters_count: number;
}

/**
 * Enrich a list of project rows with settled funding figures. Never throws —
 * on any failure the projects come back with zeros (honest default: we never
 * show a number we couldn't derive from the ledger).
 */
export async function enrichProjectsWithSettledFunding<
  T extends { id: string; currency?: string | null },
>(supabase: AnySupabaseClient, projects: T[]): Promise<Array<T & SettledProjectFunding>> {
  if (projects.length === 0) {
    return [];
  }

  let stats: Awaited<ReturnType<typeof getEntitiesFundingStats>>;
  try {
    stats = await getEntitiesFundingStats(
      supabase,
      'project',
      projects.map(p => p.id)
    );
  } catch (error) {
    logger.warn('Funding enrichment failed; defaulting to zeros', { error }, 'Wallets');
    stats = new Map();
  }

  // Warm the rate cache once so per-project conversion is synchronous. If rates
  // are unavailable, fiat-denominated projects convert to 0 (never a made-up
  // number); BTC-denominated projects are unaffected.
  if (stats.size > 0) {
    try {
      await currencyConverter.getRates();
    } catch (error) {
      logger.warn('Rates unavailable for funding enrichment', { error }, 'Wallets');
    }
  }

  return projects.map(project => {
    const projectStats = stats.get(project.id);
    const totalBtc = projectStats?.totalBtc ?? 0;
    return {
      ...project,
      raised_amount:
        totalBtc > 0 ? convertBtcTo(totalBtc, (project.currency || 'BTC').toUpperCase()) : 0,
      settled_raised_btc: totalBtc,
      supporters_count: projectStats?.contributorCount ?? 0,
    };
  });
}
