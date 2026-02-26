/**
 * Wallet Resolution Service
 *
 * Given an entity, finds the seller's wallet and determines
 * the best available payment method: NWC > Lightning Address > On-chain.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getEntityMetadata, type EntityType } from '@/config/entity-registry';
import { decrypt } from './encryptionService';
import type { ResolvedWallet } from './types';
import { logger } from '@/utils/logger';

/**
 * Resolve the best payment method for a given entity's seller.
 *
 * Priority: NWC > Lightning Address > On-chain BTC address
 *
 * Returns null if seller has no wallet connected.
 */
export async function resolveSellerWallet(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<ResolvedWallet | null> {
  // Step 1: Find the entity's owner (seller)
  const meta = getEntityMetadata(entityType);
  const { data: entity, error: entityError } = await supabase
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

  // Step 2: Resolve the owner to a user ID
  // If userIdField is actor_id, look up the actor's user_id
  let sellerId: string;
  if (meta.userIdField === 'actor_id') {
    const { data: actor } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('user_id')
      .eq('id', ownerId)
      .single();
    if (!actor?.user_id) {
      logger.error('Actor not found', { actorId: ownerId });
      return null;
    }
    sellerId = actor.user_id;
  } else {
    // profile_id or user_id maps directly to auth user id
    sellerId = ownerId;
  }

  // Step 3: Find the seller's wallets (prefer primary, active)
  const { data: wallets } = await supabase
    .from(DATABASE_TABLES.WALLETS)
    .select('id, nwc_connection_uri, lightning_address, address_or_xpub, wallet_type, is_primary')
    .eq('profile_id', sellerId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (!wallets || wallets.length === 0) {
    return null;
  }

  // Step 4: Pick best method across all wallets
  // Priority: NWC > Lightning Address > On-chain

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

  // Fallback: use first wallet's address_or_xpub if it looks like a BTC address
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
 * Get the seller's user ID for a given entity.
 * Used when creating payment intents to populate seller_id.
 */
export async function getSellerUserId(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string
): Promise<string | null> {
  const meta = getEntityMetadata(entityType);
  const { data: entity } = await supabase
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
    const { data: actor } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('user_id')
      .eq('id', ownerId)
      .single();
    return actor?.user_id ?? null;
  }

  return ownerId;
}
