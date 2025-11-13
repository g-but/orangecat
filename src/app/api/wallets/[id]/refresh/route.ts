import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import { fetchBitcoinBalance } from '@/services/blockchain';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const API_TIMEOUT_MS = 10_000; // 10 seconds
const SATS_PER_BTC = 100_000_000;

interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Fetch from external API with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Fetch xpub balance from mempool.space with error handling
 */
async function fetchXpubBalance(xpub: string): Promise<number> {
  try {
    const res = await fetchWithTimeout(
      `https://mempool.space/api/v1/xpub/${xpub}`,
      {
        headers: { Accept: 'application/json' },
      },
      API_TIMEOUT_MS
    );

    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    if (res.status === 404) {
      // xpub not found or has no transactions
      return 0;
    }

    if (!res.ok) {
      throw new Error(`API_ERROR_${res.status}`);
    }

    const data = await res.json();
    const funded: number = data?.chain_stats?.funded_txo_sum ?? 0;
    const spent: number = data?.chain_stats?.spent_txo_sum ?? 0;
    const balanceSats = funded - spent;

    return balanceSats / SATS_PER_BTC;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        throw new Error('TIMEOUT');
      }
      if (error.message.startsWith('RATE_LIMITED') || error.message.startsWith('API_ERROR')) {
        throw error;
      }
    }
    throw new Error('NETWORK_ERROR');
  }
}

/**
 * POST /api/wallets/[id]/refresh - Refresh wallet balance (FIXED VERSION)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid wallet ID format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get wallet with proper typing
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Use denormalized user_id for efficiency
      .single();

    if (fetchError || !wallet) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Wallet not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify ownership (redundant with RLS but explicit check)
    if (wallet.user_id !== user.id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check cooldown (rate limiting)
    if (wallet.balance_updated_at) {
      const lastUpdate = new Date(wallet.balance_updated_at).getTime();
      const now = Date.now();
      const timeSinceUpdate = now - lastUpdate;

      if (timeSinceUpdate < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceUpdate) / 1000);
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Rate limited',
            code: 'RATE_LIMITED',
            details: {
              remainingSeconds,
              balance_btc: wallet.balance_btc,
              balance_updated_at: wallet.balance_updated_at,
            },
          },
          { status: 429 }
        );
      }
    }

    // Refresh balance based on wallet type
    let totalBalanceBtc: number;

    try {
      if (wallet.wallet_type === 'address') {
        // Single address - fetch balance directly
        const balanceData = await fetchBitcoinBalance(wallet.address_or_xpub);
        totalBalanceBtc = balanceData.balance_btc;
      } else if (wallet.wallet_type === 'xpub') {
        // xpub - fetch from mempool.space
        totalBalanceBtc = await fetchXpubBalance(wallet.address_or_xpub);
      } else {
        return NextResponse.json<ErrorResponse>(
          { error: 'Invalid wallet type', code: 'INVALID_WALLET_TYPE' },
          { status: 400 }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'TIMEOUT') {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Balance fetch timed out. Please try again.',
            code: 'TIMEOUT',
          },
          { status: 504 }
        );
      }

      if (errorMessage === 'RATE_LIMITED') {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Blockchain API rate limited. Please wait a few minutes and try again.',
            code: 'EXTERNAL_RATE_LIMITED',
          },
          { status: 429 }
        );
      }

      if (errorMessage.startsWith('API_ERROR')) {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Blockchain API error. Please check your address/xpub and try again.',
            code: 'BLOCKCHAIN_API_ERROR',
          },
          { status: 502 }
        );
      }

      if (errorMessage === 'NETWORK_ERROR') {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Network error while fetching balance. Please try again.',
            code: 'NETWORK_ERROR',
          },
          { status: 503 }
        );
      }

      // Unknown error
      console.error('Balance fetch error:', error);
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Failed to fetch balance',
          code: 'FETCH_ERROR',
        },
        { status: 500 }
      );
    }

    // Validate balance
    if (typeof totalBalanceBtc !== 'number' || isNaN(totalBalanceBtc) || totalBalanceBtc < 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid balance received from blockchain',
          code: 'INVALID_BALANCE',
        },
        { status: 500 }
      );
    }

    // Update wallet balance with transaction safety
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({
        balance_btc: totalBalanceBtc,
        balance_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure still owned by same user
      .select()
      .single();

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Failed to update wallet balance',
          code: 'UPDATE_ERROR',
        },
        { status: 500 }
      );
    }

    if (!updatedWallet) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Wallet was deleted or ownership changed during update',
          code: 'WALLET_CHANGED',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        wallet: updatedWallet,
        message: 'Balance refreshed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected balance refresh error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
