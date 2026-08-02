/**
 * Shared-wallet usage — the honesty layer for Bitcoin address reuse.
 *
 * On-chain payments to the same address are publicly linkable by anyone with a
 * block explorer. When an owner routes several entities into one wallet, a
 * backer paying entity A can see (on-chain) that the address also collects for
 * B and C — so the platform should say so up front rather than let backers
 * discover it later.
 *
 * Deliberately disclosed as a BARE COUNT, never a list: naming the sibling
 * entities here would hand out an owner's full portfolio in one call — a
 * reverse-lookup the platform intentionally does not offer. The blockchain
 * only ever reveals payments actually made; we match that bar, not lower it.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getAdminClient } from '@/lib/supabase/admin';
import { resolveSellerWallet } from '@/domain/payments';
import type { EntityType } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

export interface SharedWalletUsage {
  /** Other entities explicitly linked to the same receiving wallet. */
  shared_count: number;
  /**
   * The wallet is its owner's default (is_primary) — entities with no explicit
   * link fall back to it too, so sharing extends beyond the linked count.
   */
  is_owner_default: boolean;
  /**
   * Wallet is configured with an xpub: every payment derives a fresh, never
   * reused address, so payments are NOT linkable on-chain. No warning needed.
   */
  fresh_address_per_payment: boolean;
}

/**
 * Resolve how shared an entity's receiving wallet is, using the SAME wallet
 * resolution the payment flow uses (SSOT) — what we disclose is what actually
 * receives the money. Returns null when no wallet resolves, when resolution
 * fails, or for group treasuries (a group wallet is expected to be shared —
 * that's what a treasury is, and it lives outside entity_wallets).
 */
export async function getSharedWalletUsage(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<SharedWalletUsage | null> {
  try {
    const resolved = await resolveSellerWallet(supabase, entityType, entityId);
    if (!resolved) {
      return null;
    }

    const admin = getAdminClient() as unknown as SupabaseClient;

    // Group wallets live in group_wallets — a wallets-table lookup misses and
    // we correctly return null (treasury sharing isn't a privacy leak).
    const { data: wallet } = await admin
      .from(DATABASE_TABLES.WALLETS)
      .select('id, is_primary')
      .eq('id', resolved.wallet_id)
      .maybeSingle();
    if (!wallet) {
      return null;
    }

    const { data: links } = await admin
      .from(DATABASE_TABLES.ENTITY_WALLETS)
      .select('entity_type, entity_id')
      .eq('wallet_id', resolved.wallet_id);

    const sharedCount = (links ?? []).filter(
      l => !(l.entity_type === entityType && l.entity_id === entityId)
    ).length;

    return {
      shared_count: sharedCount,
      is_owner_default: !!wallet.is_primary,
      fresh_address_per_payment: resolved.method === 'onchain' && !!resolved.onchain_xpub,
    };
  } catch (error) {
    // Disclosure is best-effort: a failure here must never break the page or
    // the payment flow it annotates.
    logger.warn('getSharedWalletUsage failed', { entityType, entityId, error });
    return null;
  }
}
