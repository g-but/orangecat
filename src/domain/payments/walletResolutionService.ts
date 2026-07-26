/**
 * Wallet Resolution Service
 *
 * Given an entity, finds the seller's wallet and determines
 * the best available payment method: NWC > Lightning Address > On-chain.
 *
 * Supports both user actors (personal wallets) and group actors (group_wallets).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getEntityMetadata, type EntityType } from '@/config/entity-registry';
import { getAdminClient } from '@/lib/supabase/admin';
import { decrypt } from './encryptionService';
import type { ResolvedWallet } from './types';
import { logger } from '@/utils/logger';

/**
 * Resolve the best payment method for a given entity's seller.
 *
 * Priority: NWC > Lightning Address > On-chain BTC address
 *
 * For user-owned entities, looks up the user's wallets table.
 * For group-owned entities, looks up the group_wallets table.
 *
 * Returns null if seller has no wallet connected.
 */
export async function resolveSellerWallet(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<ResolvedWallet | null> {
  // Use admin client for cross-user seller lookups (actor + wallet tables).
  // The buyer's JWT cannot see the seller's actor record due to RLS.
  // Cast to untyped client — queries use dynamic column names from entity registry.
  const admin = getAdminClient() as unknown as SupabaseClient;

  // Step 0: Entity-specific wallet override. If the owner explicitly tied a
  // wallet to THIS entity (entity_wallets), that wallet receives the funds —
  // regardless of which wallet is their profile default. Owners may have
  // multiple addresses and route different entities to different ones. Falls
  // through to the owner's primary wallet (Step 1) when no link exists.
  const linked = await resolveLinkedEntityWallet(admin, entityType, entityId);
  if (linked) {
    return linked;
  }

  // A group is itself the receiving organization. Never silently route club
  // support into the founder's personal wallet just because `groups.created_by`
  // is also its ownership field.
  if (entityType === 'group') {
    return resolveGroupWallet(admin, entityId);
  }

  // Step 1: Find the entity's owner (seller)
  const meta = getEntityMetadata(entityType);
  const { data: entity, error: entityError } = await admin
    .from(meta.tableName)
    .select(`id, ${meta.userIdField}`)
    .eq('id', entityId)
    .single();

  if (entityError || !entity) {
    logger.error('Entity not found for wallet resolution', {
      entityType,
      entityId,
      error: entityError,
    });
    return null;
  }

  // The userIdField could be actor_id, user_id, or profile_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic column from entity registry
  const ownerId = (entity as any)[meta.userIdField] as string;

  // Step 2: Resolve the owner to an actor or user ID
  // If userIdField is actor_id, look up the actor to determine if it's a user or group
  if (meta.userIdField === 'actor_id') {
    const { data: actor } = await admin
      .from(DATABASE_TABLES.ACTORS)
      .select('actor_type, user_id, group_id')
      .eq('id', ownerId)
      .single();

    if (!actor) {
      logger.error('Actor not found for wallet resolution', { actorId: ownerId });
      return null;
    }

    if (actor.actor_type === 'group' && actor.group_id) {
      // Group actor: resolve wallet from group_wallets table
      return resolveGroupWallet(admin, actor.group_id);
    }

    if (!actor.user_id) {
      logger.error('User actor missing user_id', { actorId: ownerId });
      return null;
    }

    // User actor: resolve wallet from wallets table
    return resolveUserWallet(admin, actor.user_id);
  }

  // profile_id or user_id maps directly to auth user id
  return resolveUserWallet(admin, ownerId);
}

/** Display-safe receiving info for an entity (no secrets — never the NWC URI). */
export interface SellerReceiveInfo {
  method: ResolvedWallet['method'];
  /**
   * Receiving address to show: the Lightning address or on-chain address.
   * Null for NWC (a connection has no static address to display).
   */
  address: string | null;
}

/**
 * Resolve display-safe receiving info for an entity, reusing the same wallet
 * resolution the payment flow uses (SSOT) so what the owner sees matches what
 * buyers will actually pay to. Returns null when no wallet is connected.
 */
export async function resolveSellerReceiveInfo(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<SellerReceiveInfo | null> {
  const resolved = await resolveSellerWallet(supabase, entityType, entityId);
  if (!resolved) {
    return null;
  }

  const address =
    resolved.method === 'lightning_address'
      ? (resolved.lightning_address ?? null)
      : resolved.method === 'onchain'
        ? (resolved.onchain_address ?? null)
        : null;

  return { method: resolved.method, address };
}

/**
 * Get the seller's user ID for a given entity.
 * Used when creating payment intents to populate seller_id.
 *
 * For user actors, returns the user's auth ID directly.
 * For group actors, returns the group founder's user ID (created_by),
 * which is used for notifications and access control on the payment intent.
 */
export async function getSellerUserId(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<string | null> {
  // Use admin client: buyer's JWT cannot see the seller's actor record due to RLS.
  // Cast to untyped client — queries use dynamic column names from entity registry.
  const admin = getAdminClient() as unknown as SupabaseClient;
  const meta = getEntityMetadata(entityType);
  const { data: entity } = await admin
    .from(meta.tableName)
    .select(`id, ${meta.userIdField}`)
    .eq('id', entityId)
    .single();

  if (!entity) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic column from entity registry
  const ownerId = (entity as any)[meta.userIdField] as string;

  if (meta.userIdField === 'actor_id') {
    const { data: actor } = await admin
      .from(DATABASE_TABLES.ACTORS)
      .select('actor_type, user_id, group_id')
      .eq('id', ownerId)
      .single();

    if (!actor) {
      return null;
    }

    // User actor: return user_id directly
    if (actor.actor_type === 'user') {
      return actor.user_id ?? null;
    }

    // Group actor: return the group founder's user_id for notifications/access control
    if (actor.actor_type === 'group' && actor.group_id) {
      const { data: group } = await admin
        .from(DATABASE_TABLES.GROUPS)
        .select('created_by')
        .eq('id', actor.group_id)
        .single();
      return group?.created_by ?? null;
    }

    return null;
  }

  return ownerId;
}

// =====================================================================
// INTERNAL HELPERS
// =====================================================================

/** A wallet row shaped for payment-method selection. */
interface WalletRow {
  id: string;
  nwc_connection_uri?: string | null;
  lightning_address?: string | null;
  address_or_xpub?: string | null;
}

/**
 * Pick the best payment method from a SINGLE wallet row.
 * Priority: NWC > Lightning Address > On-chain. Returns null if the wallet has
 * no usable payment detail (or its NWC URI fails to decrypt).
 */
function pickMethodFromWallet(wallet: WalletRow): ResolvedWallet | null {
  if (wallet.nwc_connection_uri) {
    try {
      return { method: 'nwc', wallet_id: wallet.id, nwc_uri: decrypt(wallet.nwc_connection_uri) };
    } catch (e) {
      logger.error('Failed to decrypt NWC URI', { walletId: wallet.id, error: e });
      // Fall through to next method
    }
  }

  if (wallet.lightning_address) {
    return {
      method: 'lightning_address',
      wallet_id: wallet.id,
      lightning_address: wallet.lightning_address,
    };
  }

  if (wallet.address_or_xpub) {
    return { method: 'onchain', wallet_id: wallet.id, onchain_address: wallet.address_or_xpub };
  }

  return null;
}

/**
 * Resolve the wallet explicitly linked to a specific entity via entity_wallets.
 * is_primary-first so the choice is deterministic when several are linked.
 * Returns null when no active linked wallet yields a usable payment method.
 */
async function resolveLinkedEntityWallet(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<ResolvedWallet | null> {
  const { data: links } = await supabase
    .from(DATABASE_TABLES.ENTITY_WALLETS)
    .select('wallet_id, is_primary')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('is_primary', { ascending: false });

  if (!links || links.length === 0) {
    return null;
  }

  for (const link of links as Array<{ wallet_id: string }>) {
    const { data: wallet } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('id, nwc_connection_uri, lightning_address, address_or_xpub')
      .eq('id', link.wallet_id)
      .eq('is_active', true)
      .single();

    if (!wallet) {
      continue;
    }

    const resolved = pickMethodFromWallet(wallet as WalletRow);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

/**
 * Resolve best wallet for a user from the wallets table.
 * Priority across wallets: a wallet with NWC > one with a Lightning Address >
 * one with an on-chain address. Primary wallet wins ties (ordered first).
 */
export async function resolveUserWallet(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolvedWallet | null> {
  const { data: wallets } = await supabase
    .from(DATABASE_TABLES.WALLETS)
    .select('id, nwc_connection_uri, lightning_address, address_or_xpub, wallet_type, is_primary')
    .eq('profile_id', userId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (!wallets || wallets.length === 0) {
    return null;
  }

  // Check for NWC
  const nwcWallet = wallets.find(w => w.nwc_connection_uri);
  if (nwcWallet) {
    try {
      const decryptedUri = decrypt(nwcWallet.nwc_connection_uri!);
      return {
        method: 'nwc',
        wallet_id: nwcWallet.id,
        nwc_uri: decryptedUri,
      };
    } catch (e) {
      logger.error('Failed to decrypt NWC URI', { walletId: nwcWallet.id, error: e });
      // Fall through to next method
    }
  }

  // Check for Lightning Address
  const lnWallet = wallets.find(w => w.lightning_address);
  if (lnWallet) {
    return {
      method: 'lightning_address',
      wallet_id: lnWallet.id,
      lightning_address: lnWallet.lightning_address!,
    };
  }

  // Check for on-chain address
  const onchainWallet = wallets.find(
    w => w.address_or_xpub && (w.wallet_type === 'onchain' || w.wallet_type === 'both')
  );
  if (onchainWallet) {
    return {
      method: 'onchain',
      wallet_id: onchainWallet.id,
      onchain_address: onchainWallet.address_or_xpub!,
    };
  }

  // Fallback: use first wallet's address_or_xpub if available
  const fallback = wallets[0];
  if (fallback.address_or_xpub) {
    return {
      method: 'onchain',
      wallet_id: fallback.id,
      onchain_address: fallback.address_or_xpub,
    };
  }

  return null;
}

/**
 * Resolve best wallet for a group from the group_wallets table.
 * Priority: Lightning Address > On-chain (group_wallets has no NWC support)
 */
async function resolveGroupWallet(
  supabase: SupabaseClient,
  groupId: string
): Promise<ResolvedWallet | null> {
  const { data: wallets } = await supabase
    .from(DATABASE_TABLES.GROUP_WALLETS)
    .select('id, lightning_address, bitcoin_address, is_active')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (!wallets || wallets.length === 0) {
    logger.warn('No active group wallets found', { groupId });
    return null;
  }

  // Check for Lightning Address
  const lnWallet = wallets.find(w => w.lightning_address);
  if (lnWallet) {
    return {
      method: 'lightning_address',
      wallet_id: lnWallet.id,
      lightning_address: lnWallet.lightning_address!,
    };
  }

  // Check for on-chain Bitcoin address
  const onchainWallet = wallets.find(w => w.bitcoin_address);
  if (onchainWallet) {
    return {
      method: 'onchain',
      wallet_id: onchainWallet.id,
      onchain_address: onchainWallet.bitcoin_address!,
    };
  }

  logger.warn('Group wallets exist but none have payment addresses', { groupId });
  return null;
}
