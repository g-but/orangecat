/**
 * Treasury Balance Management
 *
 * Handles fetching and updating treasury balances from external APIs.
 * Follows the Network State Development Guide Phase 4.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial implementation
 */

import { logger } from '@/utils/logger';
import { TABLES } from '../constants';
import supabase from '@/lib/supabase/browser';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Fetch Bitcoin balance from mempool.space API
 *
 * @param bitcoinAddress - Bitcoin address to check
 * @returns Balance in sats, or null if error
 */
export async function fetchBitcoinBalance(bitcoinAddress: string): Promise<number | null> {
  try {
    const response = await fetch(`https://mempool.space/api/address/${bitcoinAddress}`);

    if (!response.ok) {
      logger.warn(
        'Failed to fetch balance from mempool.space',
        {
          address: bitcoinAddress,
          status: response.status,
        },
        'Groups'
      );
      return null;
    }

    const data = await response.json();

    // mempool.space returns balance in sats
    const _balanceSats = data.chain_stats?.funded_txo_sum || 0;
    const unspentSats = data.chain_stats?.tx_count
      ? data.chain_stats.funded_txo_sum - (data.chain_stats.spent_txo_sum || 0)
      : 0;

    // Return unspent balance (actual available balance)
    return Math.max(0, unspentSats);
  } catch (error) {
    logger.error('Exception fetching Bitcoin balance', error, 'Groups');
    return null;
  }
}

/**
 * Update treasury balance for a group wallet
 *
 * @param walletId - Wallet ID to update
 * @param balanceSats - New balance in sats
 * @param client - Optional Supabase client override
 */
export async function updateWalletBalance(
  walletId: string,
  balanceSats: number,
  client?: AnySupabaseClient
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = client || supabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_wallets) as any
    )
      .update({
        current_balance_sats: balanceSats,
        last_balance_update: new Date().toISOString(),
      })
      .eq('id', walletId);

    if (error) {
      logger.error('Failed to update wallet balance', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Exception updating wallet balance', error, 'Groups');
    return { success: false, error: 'Failed to update balance' };
  }
}

/**
 * Update treasury balance for a group wallet by fetching from blockchain
 *
 * @param walletId - Wallet ID to update
 * @param client - Optional Supabase client override
 */
export async function refreshWalletBalance(
  walletId: string,
  client?: AnySupabaseClient
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const sb = client || supabase;
    // Get wallet with Bitcoin address
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wallet, error: fetchError } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_wallets) as any
    )
      .select('bitcoin_address')
      .eq('id', walletId)
      .single();

    if (fetchError || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (!wallet.bitcoin_address) {
      return { success: false, error: 'Wallet has no Bitcoin address' };
    }

    // Fetch balance from mempool.space
    const balanceSats = await fetchBitcoinBalance(wallet.bitcoin_address);

    if (balanceSats === null) {
      return { success: false, error: 'Failed to fetch balance from blockchain' };
    }

    // Update wallet balance
    const updateResult = await updateWalletBalance(walletId, balanceSats, sb);

    if (!updateResult.success) {
      return updateResult;
    }

    return { success: true, balance: balanceSats };
  } catch (error) {
    logger.error('Exception refreshing wallet balance', error, 'Groups');
    return { success: false, error: 'Failed to refresh balance' };
  }
}

/**
 * Update all wallet balances for a group
 *
 * @param groupId - Group ID
 * @param client - Optional Supabase client override
 */
export async function refreshGroupTreasuryBalances(
  groupId: string,
  client?: AnySupabaseClient
): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    const sb = client || supabase;
    // Get all wallets for the group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wallets, error: fetchError } = await (
      sb
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(TABLES.group_wallets) as any
    )
      .select('id, bitcoin_address')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .not('bitcoin_address', 'is', null);

    if (fetchError) {
      logger.error('Failed to fetch group wallets', fetchError, 'Groups');
      return { success: false, updated: 0, error: fetchError.message };
    }

    if (!wallets || wallets.length === 0) {
      return { success: true, updated: 0 };
    }

    // Update each wallet balance
    let updated = 0;
    for (const wallet of wallets) {
      if (wallet.bitcoin_address) {
        const result = await refreshWalletBalance(wallet.id, sb);
        if (result.success) {
          updated++;
        }
      }
    }

    return { success: true, updated };
  } catch (error) {
    logger.error('Exception refreshing group treasury balances', error, 'Groups');
    return { success: false, updated: 0, error: 'Failed to refresh balances' };
  }
}
