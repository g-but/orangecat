/**
 * Entity funding stats — the honest public total for a fundraising entity.
 *
 * Reads the settled `contributions` ledger via the `get_entity_funding_stats`
 * RPC, which is gated by the entity's primary wallet-link visibility:
 *   - private → returns null (expose nothing)
 *   - total / public → returns the aggregate {totalBtc, contributorCount}
 *
 * The total includes anonymous contribution AMOUNTS but never anonymous
 * identities (enforced server-side in the SECURITY DEFINER function). It is
 * derived from the ledger, never from a cached wallet balance — a cached
 * balance can be overwritten by the next chain refresh and would lie.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import type { EntityType } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

export interface EntityFundingStats {
  /** Sum of all settled contributions, in BTC. */
  totalBtc: number;
  /** Count of all contributions (anonymous included). */
  contributorCount: number;
  /** Count of non-anonymous contributions (the publicly-nameable supporters). */
  namedSupporterCount: number;
}

/**
 * Fetch the public funding stats for an entity, or null when the fundraise is
 * private (or has no primary wallet link). Never throws — logs and returns
 * null on error so a funding page degrades gracefully.
 */
export async function getEntityFundingStats(
  supabase: AnySupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<EntityFundingStats | null> {
  const { data, error } = await supabase.rpc('get_entity_funding_stats', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) {
    logger.warn('Failed to load entity funding stats', { entityType, entityId, error }, 'Wallets');
    return null;
  }

  // The RPC returns zero rows for a private fundraise.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return null;
  }

  return {
    totalBtc: Number(row.total_btc ?? 0),
    contributorCount: Number(row.contributor_count ?? 0),
    namedSupporterCount: Number(row.named_supporter_count ?? 0),
  };
}

/**
 * Batch variant for list surfaces: settled funding stats for many entities in
 * ONE RPC (`get_entities_funding_stats`) — no N+1 per card. Entities that are
 * private or have no settled contributions are simply absent from the map.
 * Never throws — logs and returns an empty map so lists degrade to zeros.
 */
export async function getEntitiesFundingStats(
  supabase: AnySupabaseClient,
  entityType: EntityType,
  entityIds: string[]
): Promise<Map<string, EntityFundingStats>> {
  const map = new Map<string, EntityFundingStats>();
  if (entityIds.length === 0) {
    return map;
  }

  const { data, error } = await supabase.rpc('get_entities_funding_stats', {
    p_entity_type: entityType,
    p_entity_ids: entityIds,
  });

  if (error) {
    logger.warn(
      'Failed to load batch entity funding stats',
      { entityType, count: entityIds.length, error },
      'Wallets'
    );
    return map;
  }

  for (const row of (data as Array<Record<string, unknown>> | null) ?? []) {
    map.set(String(row.entity_id), {
      totalBtc: Number(row.total_btc ?? 0),
      contributorCount: Number(row.contributor_count ?? 0),
      namedSupporterCount: Number(row.named_supporter_count ?? 0),
    });
  }
  return map;
}
