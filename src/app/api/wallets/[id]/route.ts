import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import { WalletFormData, validateAddressOrXpub, detectWalletType } from '@/types/wallet';
import { logger } from '@/utils/logger';
import { FALLBACK_WALLETS_KEY, POSTGRES_TABLE_NOT_FOUND } from '@/lib/wallets/constants';
import {
  logWalletError,
  handleSupabaseError,
  isTableNotFoundError,
  createWalletErrorResponse,
} from '@/lib/wallets/errorHandling';
import { type ProfileMetadata, isProfileMetadata } from '@/lib/wallets/types';

async function updateFallbackProfileWallet(
  profileId: string,
  walletId: string,
  body: Partial<WalletFormData>,
  supabase: Awaited<ReturnType<typeof createServerClient>>
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('metadata, user_id')
    .eq('id', profileId)
    .single();

  if (error || !profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  const metadata: ProfileMetadata = isProfileMetadata(profile?.metadata) ? profile.metadata : {};
  const wallets = Array.isArray(metadata[FALLBACK_WALLETS_KEY])
    ? (metadata[FALLBACK_WALLETS_KEY] as Wallet[])
    : [];

  const index = wallets.findIndex(w => w.id === walletId);
  if (index === -1) {
    return null;
  }

  const existing = wallets[index];
  const updates: Partial<Wallet> = {};

  if (body.label !== undefined) {
    if (!body.label.trim()) {
      throw new Error('LABEL_EMPTY');
    }
    updates.label = body.label.trim();
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null;
  }

  if (body.address_or_xpub !== undefined) {
    const validation = validateAddressOrXpub(body.address_or_xpub);
    if (!validation.valid) {
      throw new Error(validation.error || 'INVALID_ADDRESS');
    }
    updates.address_or_xpub = body.address_or_xpub.trim();
    updates.wallet_type = detectWalletType(body.address_or_xpub);
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

  if (body.is_primary !== undefined) {
    updates.is_primary = body.is_primary;

    // If setting this wallet as primary, unset all other wallets
    if (body.is_primary === true) {
      wallets.forEach((w, idx) => {
        if (w.id !== walletId && w.is_active) {
          wallets[idx] = { ...w, is_primary: false, updated_at: new Date().toISOString() };
        }
      });
    }
  }

  const updated = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const nextWallets = [...wallets];
  nextWallets[index] = updated;

  const updatedMetadata = {
    ...metadata,
    [FALLBACK_WALLETS_KEY]: nextWallets,
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ metadata: updatedMetadata })
    .eq('id', profileId);

  if (updateError) {
    throw new Error('METADATA_UPDATE_FAILED');
  }

  return updated;
}

async function deleteFallbackProfileWallet(
  profileId: string,
  walletId: string,
  supabase: Awaited<ReturnType<typeof createServerClient>>
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('metadata, user_id')
    .eq('id', profileId)
    .single();

  if (error || !profile) {
    throw new Error('PROFILE_NOT_FOUND');
  }

  const metadata: ProfileMetadata = isProfileMetadata(profile?.metadata) ? profile.metadata : {};
  const wallets = Array.isArray(metadata[FALLBACK_WALLETS_KEY])
    ? (metadata[FALLBACK_WALLETS_KEY] as Wallet[])
    : [];

  const index = wallets.findIndex(w => w.id === walletId);
  if (index === -1) {
    return false;
  }

  // Soft delete by setting is_active to false
  const updatedWallets = [...wallets];
  updatedWallets[index] = {
    ...updatedWallets[index],
    is_active: false,
    updated_at: new Date().toISOString(),
  };

  const updatedMetadata = {
    ...metadata,
    [FALLBACK_WALLETS_KEY]: updatedWallets,
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ metadata: updatedMetadata })
    .eq('id', profileId);

  if (updateError) {
    throw new Error('METADATA_UPDATE_FAILED');
  }

  return true;
}

// PATCH /api/wallets/[id] - Update wallet
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<WalletFormData> & {
      profile_id?: string;
      project_id?: string;
    };

    // Try primary wallets table first
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*, profiles!wallets_profile_id_fkey(id), projects!wallets_project_id_fkey(user_id)')
      .eq('id', id)
      .single();

    // If wallets table is missing or this wallet lives in legacy profile metadata, use fallback
    if (isTableNotFoundError(fetchError) && body.profile_id) {
      try {
        const updatedFallback = await updateFallbackProfileWallet(
          body.profile_id,
          id,
          body,
          supabase
        );
        if (!updatedFallback) {
          return createWalletErrorResponse('Wallet not found', 'WALLET_NOT_FOUND', 404);
        }
        return NextResponse.json({ wallet: updatedFallback });
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message === 'LABEL_EMPTY') {
            return createWalletErrorResponse(
              'Label cannot be empty',
              'VALIDATION_ERROR',
              400,
              'label'
            );
          }
          if (err.message === 'INVALID_ADDRESS') {
            return createWalletErrorResponse(
              'Invalid address or xpub',
              'VALIDATION_ERROR',
              400,
              'address_or_xpub'
            );
          }
        }
        return handleSupabaseError('update fallback wallet', err, {
          walletId: id,
          profileId: body.profile_id,
        });
      }
    }

    if (fetchError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Check ownership
    // For profiles: profiles.id IS the user_id (references auth.users)
    // For projects: projects.user_id is a separate column
    interface WalletWithRelations {
      profiles?: { id: string } | null;
      projects?: { user_id: string } | null;
    }
    const walletWithRelations = wallet as WalletWithRelations;
    const ownerId = wallet.profile_id
      ? walletWithRelations.profiles?.id
      : wallet.project_id
        ? walletWithRelations.projects?.user_id
        : null;

    if (ownerId !== user.id) {
      return createWalletErrorResponse('Forbidden', 'FORBIDDEN', 403);
    }

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
        return NextResponse.json(
          { error: validation.error || 'Invalid address or xpub' },
          { status: 400 }
        );
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

    // Handle is_primary: if setting to true, unset all other wallets for this entity
    if (body.is_primary !== undefined) {
      updates.is_primary = body.is_primary;

      // If setting this wallet as primary, unset all other wallets
      if (body.is_primary === true) {
        const entityFilter = wallet.profile_id
          ? { profile_id: wallet.profile_id }
          : { project_id: wallet.project_id };

        // Unset all other wallets as primary
        await supabase
          .from('wallets')
          .update({ is_primary: false })
          .eq('is_active', true)
          .neq('id', id)
          .match(entityFilter);
      }
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
      return handleSupabaseError('update wallet', updateError, { walletId: id });
    }

    return NextResponse.json({ wallet: updatedWallet });
  } catch (error) {
    return handleSupabaseError('update wallet', error, { walletId: id });
  }
}

// DELETE /api/wallets/[id] - Delete wallet (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get wallet from the wallets table first
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*, profiles!wallets_profile_id_fkey(id), projects!wallets_project_id_fkey(user_id)')
      .eq('id', id)
      .single();

    // If wallets table is missing, try fallback for profile wallets
    if (isTableNotFoundError(fetchError)) {
      // Try to find the wallet in profile metadata by checking all user's profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, metadata')
        .eq('user_id', user.id);

      if (profiles) {
        for (const profile of profiles) {
          const metadata: ProfileMetadata = isProfileMetadata(profile?.metadata)
            ? profile.metadata
            : {};
          const wallets = Array.isArray(metadata[FALLBACK_WALLETS_KEY])
            ? (metadata[FALLBACK_WALLETS_KEY] as Wallet[])
            : [];
          const walletExists = wallets.some(w => w.id === id && w.is_active);

          if (walletExists) {
            try {
              const deleted = await deleteFallbackProfileWallet(profile.id, id, supabase);
              if (deleted) {
                return NextResponse.json({ success: true });
              }
            } catch (err: unknown) {
              return handleSupabaseError('delete fallback wallet', err, {
                walletId: id,
                profileId: profile.id,
              });
            }
          }
        }
      }

      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (fetchError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Check ownership
    // For profiles: profiles.id IS the user_id (references auth.users)
    // For projects: projects.user_id is a separate column
    interface WalletWithRelations {
      profiles?: { id: string } | null;
      projects?: { user_id: string } | null;
    }
    const walletWithRelations = wallet as WalletWithRelations;
    const ownerId = wallet.profile_id
      ? walletWithRelations.profiles?.id
      : wallet.project_id
        ? walletWithRelations.projects?.user_id
        : null;

    if (ownerId !== user.id) {
      return createWalletErrorResponse('Forbidden', 'FORBIDDEN', 403);
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('wallets')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      return handleSupabaseError('delete wallet', deleteError, { walletId: id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleSupabaseError('delete wallet', error, { walletId: id });
  }
}
