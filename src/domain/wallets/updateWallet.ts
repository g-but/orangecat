/**
 * Wallet Update / Delete Domain Service
 *
 * Business logic shared by PATCH and DELETE handlers on /api/wallets/[id].
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { validateAddressOrXpub, detectWalletType, type Wallet } from '@/types/wallet';
import { logger } from '@/utils/logger';
import { apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { z } from 'zod';
import type { walletUpdateSchema } from '@/lib/validation/finance';
import type { NextResponse } from 'next/server';

type WalletUpdateInput = z.infer<typeof walletUpdateSchema>;

type WalletWithRelations = Wallet & {
  profiles?: { id: string } | null;
  projects?: { user_id: string } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResponse = NextResponse<any>;

interface FetchResult {
  wallet: WalletWithRelations;
  error: null;
}
interface FetchError {
  wallet: null;
  error: AnyResponse;
}

/**
 * Fetch a wallet and verify the caller owns it.
 * Returns the wallet on success, or an HTTP error response on failure.
 */
export async function fetchWalletAndVerifyOwner(
  supabase: SupabaseClient,
  walletId: string,
  userId: string,
  action: string
): Promise<FetchResult | FetchError> {
  const { data: walletData, error: fetchError } = await supabase
    .from(DATABASE_TABLES.WALLETS)
    .select('*, profiles!wallets_profile_id_fkey(id), projects!wallets_project_id_fkey(user_id)')
    .eq('id', walletId)
    .single();

  const wallet = walletData as WalletWithRelations | null;

  if (fetchError || !wallet) {
    logger.error(`Wallet not found for ${action}`, { walletId, error: fetchError?.message });
    return { wallet: null, error: apiNotFound('Wallet not found') };
  }

  const ownerId = wallet.profile_id
    ? wallet.profiles?.id
    : wallet.project_id
      ? wallet.projects?.user_id
      : null;

  if (ownerId !== userId) {
    logger.warn(`Unauthorized wallet ${action} attempt`, { walletId, userId, ownerId });
    return {
      wallet: null,
      error: apiForbidden(`You do not have permission to ${action} this wallet`),
    };
  }

  return { wallet, error: null };
}

/**
 * Build the DB update object from a validated PATCH body.
 * Returns an error response if the address/xpub is invalid; null otherwise.
 */
export function buildWalletUpdates(
  body: WalletUpdateInput
): { updates: Partial<Wallet>; error: null } | { updates: null; error: AnyResponse } {
  const updates: Partial<Wallet> = {};

  if (body.label !== undefined)           {updates.label = body.label.trim();}
  if (body.description !== undefined)     {updates.description = body.description?.trim() || null;}
  if (body.category !== undefined)        {updates.category = body.category;}
  if (body.category_icon !== undefined)   {updates.category_icon = body.category_icon;}
  if (body.goal_amount !== undefined)     {updates.goal_amount = body.goal_amount || null;}
  if (body.goal_currency !== undefined)   {updates.goal_currency = body.goal_currency || null;}
  if (body.goal_deadline !== undefined)   {updates.goal_deadline = body.goal_deadline || null;}
  if (body.is_primary !== undefined)      {updates.is_primary = body.is_primary;}

  if (body.address_or_xpub !== undefined) {
    const validation = validateAddressOrXpub(body.address_or_xpub);
    if (!validation.valid) {
      return { updates: null, error: apiBadRequest(validation.error || 'Invalid address or xpub') };
    }
    updates.address_or_xpub = body.address_or_xpub.trim();
    updates.wallet_type = detectWalletType(body.address_or_xpub);
    updates.balance_btc = 0;
    updates.balance_updated_at = null;
  }

  updates.updated_at = new Date().toISOString();
  return { updates, error: null };
}

/**
 * When is_primary is set to true, unset all other wallets for the same entity.
 */
export async function enforceSinglePrimary(
  supabase: SupabaseClient,
  wallet: WalletWithRelations,
  walletId: string
): Promise<void> {
  const entityFilter = wallet.profile_id
    ? { profile_id: wallet.profile_id }
    : { project_id: wallet.project_id };

  await supabase
    .from(DATABASE_TABLES.WALLETS)
    .update({ is_primary: false })
    .eq('is_active', true)
    .neq('id', walletId)
    .match(entityFilter);
}
