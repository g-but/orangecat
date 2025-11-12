import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import { fetchBitcoinBalance } from '@/services/blockchain';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// POST /api/wallets/[id]/refresh - Refresh wallet balance
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get wallet and verify ownership
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*, profiles!wallets_profile_id_fkey(user_id), projects!wallets_project_id_fkey(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Check ownership
    const ownerId = wallet.profile_id
      ? (wallet.profiles as any)?.user_id
      : wallet.project_id
      ? (wallet.projects as any)?.user_id
      : null;

    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check cooldown (rate limiting)
    if (wallet.balance_updated_at) {
      const lastUpdate = new Date(wallet.balance_updated_at).getTime();
      const now = Date.now();
      const timeSinceUpdate = now - lastUpdate;

      if (timeSinceUpdate < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceUpdate) / 1000);
        return NextResponse.json(
          {
            error: 'Rate limited',
            message: `Please wait ${remainingSeconds} seconds before refreshing again`,
            balance_btc: wallet.balance_btc,
            balance_updated_at: wallet.balance_updated_at,
          },
          { status: 429 }
        );
      }
    }

    // Refresh balance based on wallet type
    let totalBalanceBtc = 0;

    if (wallet.wallet_type === 'address') {
      // Single address - fetch balance directly
      const balanceData = await fetchBitcoinBalance(wallet.address_or_xpub);
      totalBalanceBtc = balanceData.balance_btc;
    } else if (wallet.wallet_type === 'xpub') {
      // xpub - derive addresses and fetch balances
      // For MVP, we'll fetch the xpub balance from mempool.space
      // (they support xpub endpoints)
      try {
        const res = await fetch(`https://mempool.space/api/v1/xpub/${wallet.address_or_xpub}`, {
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          throw new Error(`Mempool API error: ${res.status}`);
        }

        const data = await res.json();
        const funded: number = data?.chain_stats?.funded_txo_sum ?? 0;
        const spent: number = data?.chain_stats?.spent_txo_sum ?? 0;
        const balanceSats = funded - spent;
        totalBalanceBtc = balanceSats / 100_000_000;

        // TODO: Store individual addresses in wallet_addresses table
        // For now, we just update the total balance
      } catch (error) {
        console.error('xpub balance fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch xpub balance. Please check your xpub format.' },
          { status: 400 }
        );
      }
    }

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({
        balance_btc: totalBalanceBtc,
        balance_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    return NextResponse.json({
      wallet: updatedWallet,
      message: 'Balance refreshed successfully',
    });
  } catch (error) {
    console.error('Balance refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
