import { logger } from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for internal transfers
const transferSchema = z.object({
  from_wallet_id: z.string().uuid('Invalid wallet ID'),
  to_wallet_id: z.string().uuid('Invalid wallet ID'),
  amount_btc: z.number().positive('Amount must be positive').max(21_000_000, 'Amount exceeds max BTC supply'),
  note: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const rawBody = await request.json();

    // Validate input
    const body = transferSchema.parse(rawBody);

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Prevent transferring to the same wallet
    if (body.from_wallet_id === body.to_wallet_id) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same wallet' },
        { status: 400 }
      );
    }

    // Fetch both wallets and verify ownership
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('id, user_id, label, balance_btc, profile_id, project_id')
      .in('id', [body.from_wallet_id, body.to_wallet_id]);

    if (walletsError || !wallets || wallets.length !== 2) {
      logger.error('Wallet fetch error:', walletsError);
      return NextResponse.json({ error: 'One or both wallets not found' }, { status: 404 });
    }

    const fromWallet = wallets.find(w => w.id === body.from_wallet_id);
    const toWallet = wallets.find(w => w.id === body.to_wallet_id);

    if (!fromWallet || !toWallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Verify both wallets belong to the user
    if (fromWallet.user_id !== user.id || toWallet.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only transfer between your own wallets' },
        { status: 403 }
      );
    }

    // Check sufficient balance
    if (fromWallet.balance_btc < body.amount_btc) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          details: {
            available: fromWallet.balance_btc,
            requested: body.amount_btc,
          },
        },
        { status: 400 }
      );
    }

    // Convert BTC to satoshis for transaction record
    const amount_sats = Math.round(body.amount_btc * 100_000_000);

    // Determine entity types for transaction record
    const from_entity_type = fromWallet.profile_id ? 'profile' : 'project';
    const from_entity_id = fromWallet.profile_id || fromWallet.project_id;
    const to_entity_type = toWallet.profile_id ? 'profile' : 'project';
    const to_entity_id = toWallet.profile_id || toWallet.project_id;

    // Create transaction record (marked as internal transfer)
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        amount_sats,
        from_entity_type,
        from_entity_id,
        to_entity_type,
        to_entity_id,
        payment_method: 'bitcoin',
        message: body.note || `Transfer from ${fromWallet.label} to ${toWallet.label}`,
        purpose: 'internal_transfer',
        anonymous: false,
        public_visibility: false, // Internal transfers are private
        status: 'completed', // Internal transfers complete immediately
        initiated_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        settled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      logger.error('Transaction creation error:', txError);
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 });
    }

    // Update wallet balances
    const { error: updateError } = await supabase.rpc('transfer_between_wallets', {
      p_from_wallet_id: body.from_wallet_id,
      p_to_wallet_id: body.to_wallet_id,
      p_amount_btc: body.amount_btc,
      p_transaction_id: transaction.id,
    });

    if (updateError) {
      logger.error('Balance update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update wallet balances' },
        { status: 500 }
      );
    }

    // Fetch updated wallets
    const { data: updatedWallets } = await supabase
      .from('wallets')
      .select('*')
      .in('id', [body.from_wallet_id, body.to_wallet_id]);

    return NextResponse.json({
      success: true,
      transaction,
      wallets: updatedWallets,
      message: `Transferred ${body.amount_btc} BTC from ${fromWallet.label} to ${toWallet.label}`,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn('Transfer validation failed:', error.errors);
      return NextResponse.json(
        {
          error: 'Invalid transfer data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('Transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
