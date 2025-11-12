import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import { WalletFormData, validateAddressOrXpub, detectWalletType } from '@/types/wallet';

// PATCH /api/wallets/[id] - Update wallet
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = (await request.json()) as Partial<WalletFormData>;
    const updates: any = {};

    // Validate and update fields
    if (body.label !== undefined) {
      if (!body.label.trim()) {
        return NextResponse.json({ error: 'Label cannot be empty' }, { status: 400 });
      }
      updates.label = body.label.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.address_or_xpub !== undefined) {
      const validation = validateAddressOrXpub(body.address_or_xpub);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || 'Invalid address or xpub' }, { status: 400 });
      }
      updates.address_or_xpub = body.address_or_xpub.trim();
      updates.wallet_type = detectWalletType(body.address_or_xpub);
      // Reset balance when address changes
      updates.balance_btc = 0;
      updates.balance_updated_at = null;
    }

    if (body.category !== undefined) {
      updates.category = body.category;
    }

    if (body.category_icon !== undefined) {
      updates.category_icon = body.category_icon;
    }

    if (body.goal_amount !== undefined) {
      updates.goal_amount = body.goal_amount || null;
    }

    if (body.goal_currency !== undefined) {
      updates.goal_currency = body.goal_currency || null;
    }

    if (body.goal_deadline !== undefined) {
      updates.goal_deadline = body.goal_deadline || null;
    }

    updates.updated_at = new Date().toISOString();

    // Update wallet
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating wallet:', updateError);
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }

    return NextResponse.json({ wallet: updatedWallet });
  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/wallets/[id] - Delete wallet (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Soft delete
    const { error: deleteError } = await supabase.from('wallets').update({ is_active: false }).eq('id', id);

    if (deleteError) {
      console.error('Error deleting wallet:', deleteError);
      return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wallet deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
