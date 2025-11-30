import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import {
  WalletFormData,
  validateWalletFormData,
  sanitizeWalletInput,
  validateAddressOrXpub,
  detectWalletType,
} from '@/types/wallet';
import { logger } from '@/utils/logger';
import {
  FALLBACK_WALLETS_KEY,
  POSTGRES_TABLE_NOT_FOUND,
  MAX_WALLETS_PER_ENTITY,
} from '@/lib/wallets/constants';
import {
  logWalletError,
  handleSupabaseError,
  isTableNotFoundError,
  createWalletErrorResponse,
} from '@/lib/wallets/errorHandling';
import { type ProfileMetadata, isProfileMetadata } from '@/lib/wallets/types';

interface ErrorResponse {
  error: string;
  code?: string;
  field?: string;
}

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

async function getFallbackProfileWallets(supabase: SupabaseClient, profileId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', profileId)
    .single();

  if (error) {
    logWalletError('load fallback wallets', error, { profileId });
    return [];
  }

  const metadata: ProfileMetadata = isProfileMetadata(profile?.metadata) ? profile.metadata : {};
  const wallets = metadata[FALLBACK_WALLETS_KEY];

  return Array.isArray(wallets) ? wallets : [];
}

async function addFallbackProfileWallet(
  supabase: SupabaseClient,
  profileId: string,
  walletPayload: {
    label: string;
    description?: string | null;
    address_or_xpub: string;
    wallet_type: string;
    category: string;
    category_icon?: string | null;
    behavior_type?: string;
    budget_amount?: number | null;
    budget_period?: string | null;
    goal_amount?: number | null;
    goal_currency?: string | null;
    goal_deadline?: string | null;
    is_primary?: boolean;
  }
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', profileId)
    .single();

  if (error) {
    logWalletError('load profile for fallback wallet', error, { profileId });
    throw error;
  }

  const metadata: ProfileMetadata = isProfileMetadata(profile?.metadata) ? profile.metadata : {};
  const existing = Array.isArray(metadata[FALLBACK_WALLETS_KEY])
    ? (metadata[FALLBACK_WALLETS_KEY] as Wallet[])
    : [];

  const now = new Date().toISOString();

  const wallet = {
    id: crypto.randomUUID(),
    profile_id: profileId,
    project_id: null,
    created_at: now,
    updated_at: now,
    is_active: true,
    balance_btc: 0,
    display_order: existing.length,
    ...walletPayload,
  };

  const updatedMetadata = {
    ...metadata,
    [FALLBACK_WALLETS_KEY]: [...existing, wallet],
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ metadata: updatedMetadata })
    .eq('id', profileId);

  if (updateError) {
    logWalletError('save fallback wallet', updateError, { profileId });
    throw updateError;
  }

  return wallet;
}

// GET /api/wallets?profile_id=xxx OR ?project_id=xxx
// NOTE: This route currently uses the legacy `wallets` table.
// It is kept for backward compatibility while we migrate fully to the
// new wallet_definitions / wallet_ownerships / wallet_categories architecture.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profile_id');
    const projectId = searchParams.get('project_id');

    if (!profileId && !projectId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'profile_id or project_id required', code: 'MISSING_PARAMS' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const idToValidate = profileId || projectId;
    if (idToValidate && !uuidRegex.test(idToValidate)) {
      return createWalletErrorResponse('Invalid ID format', 'INVALID_ID', 400);
    }

    try {
      let query = supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      } else if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        // If the wallets table does not exist yet, gracefully fall back
        if (isTableNotFoundError(error) && profileId) {
          const fallbackWallets = await getFallbackProfileWallets(supabase, profileId);
          return NextResponse.json({ wallets: fallbackWallets }, { status: 200 });
        }

        return handleSupabaseError('fetch wallets', error, { profileId, projectId });
      }

      return NextResponse.json({ wallets: data || [] }, { status: 200 });
    } catch (innerError: unknown) {
      // Catch errors such as relation not existing that might be thrown at query time
      if (profileId && isTableNotFoundError(innerError)) {
        const fallbackWallets = await getFallbackProfileWallets(supabase, profileId);
        return NextResponse.json({ wallets: fallbackWallets }, { status: 200 });
      }

      return handleSupabaseError('fetch wallets query', innerError, { profileId, projectId });
    }
  } catch (error) {
    return handleSupabaseError('fetch wallets', error, { profileId, projectId });
  }
}

// POST /api/wallets - Create new wallet (FIXED VERSION)
export async function POST(request: NextRequest) {
  try {
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

    const body = (await request.json()) as WalletFormData & {
      profile_id?: string;
      project_id?: string;
    };

    // Validate entity ownership
    if (!body.profile_id && !body.project_id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'profile_id or project_id required', code: 'MISSING_ENTITY' },
        { status: 400 }
      );
    }

    if (body.profile_id && body.project_id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Cannot specify both profile_id and project_id', code: 'INVALID_ENTITY' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const entityId = body.profile_id || body.project_id!;
    if (!uuidRegex.test(entityId)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid entity ID format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Validate form data
    const validation = validateWalletFormData(body);
    if (!validation.valid) {
      return NextResponse.json<ErrorResponse>(
        { error: validation.error || 'Validation failed', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (body.profile_id) {
      // Profiles.id IS the user_id (references auth.users), so we can directly compare
      if (body.profile_id !== user.id) {
        logWalletError('verify profile ownership', new Error('Ownership mismatch'), {
          profile_id: body.profile_id,
          user_id: user.id,
        });
        return createWalletErrorResponse(
          'Forbidden: Profile does not belong to this user',
          'FORBIDDEN',
          403
        );
      }
    } else if (body.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', body.project_id)
        .single();

      if (!project || project.user_id !== user.id) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // Sanitize input
    const sanitized = sanitizeWalletInput(body);

    // Detect wallet type
    const walletType = detectWalletType(sanitized.address_or_xpub);

    // Double-check validation for security
    const addressValidation = validateAddressOrXpub(sanitized.address_or_xpub);
    if (!addressValidation.valid) {
      return NextResponse.json<ErrorResponse>(
        {
          error: addressValidation.error || 'Invalid address/xpub',
          code: 'INVALID_ADDRESS',
          field: 'address_or_xpub',
        },
        { status: 400 }
      );
    }

    // Check for duplicate address/xpub for this entity in the wallets table if it exists.
    // If the table does not exist (42P01), we will fall back to profile-based storage below.
    let isFirstWallet = false;

    try {
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq(body.profile_id ? 'profile_id' : 'project_id', entityId)
        .eq('address_or_xpub', sanitized.address_or_xpub)
        .eq('is_active', true)
        .single();

      if (existingWallet) {
        return NextResponse.json<ErrorResponse>(
          {
            error: 'This address/xpub is already added to this profile/project',
            code: 'DUPLICATE_ADDRESS',
          },
          { status: 409 }
        );
      }

      const { data: existingWallets } = await supabase
        .from('wallets')
        .select('id')
        .eq(body.profile_id ? 'profile_id' : 'project_id', entityId)
        .eq('is_active', true);

      const walletCount = existingWallets?.length || 0;
      isFirstWallet = walletCount === 0;

      if (walletCount >= MAX_WALLETS_PER_ENTITY) {
        return createWalletErrorResponse(
          `Maximum ${MAX_WALLETS_PER_ENTITY} wallets allowed per profile/project`,
          'WALLET_LIMIT_REACHED',
          400
        );
      }
    } catch (dupCheckError: unknown) {
      if (!isTableNotFoundError(dupCheckError)) {
        return handleSupabaseError('check existing wallets', dupCheckError, { entityId });
      }
      // If wallets table is missing, we'll handle persistence via fallback below.
    }

    // Try to create the wallet in the dedicated wallets table first
    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert({
          profile_id: body.profile_id || null,
          project_id: body.project_id || null,
          label: sanitized.label,
          description: sanitized.description || null,
          address_or_xpub: sanitized.address_or_xpub,
          wallet_type: walletType,
          category: sanitized.category,
          category_icon: sanitized.category_icon || '💰',
          behavior_type: body.behavior_type || 'general',
          budget_amount: body.budget_amount || null,
          budget_period: body.budget_period || null,
          goal_amount: sanitized.goal_amount || null,
          goal_currency: sanitized.goal_currency || null,
          goal_deadline: sanitized.goal_deadline || null,
          is_primary: body.is_primary !== undefined ? body.is_primary : isFirstWallet,
          balance_btc: 0,
        })
        .select()
        .single();

      if (error) {
        // Check for specific error messages
        if (error.message.includes(`Maximum ${MAX_WALLETS_PER_ENTITY}`)) {
          return createWalletErrorResponse(
            `Maximum ${MAX_WALLETS_PER_ENTITY} wallets allowed`,
            'WALLET_LIMIT',
            400
          );
        }

        // If the wallets table is missing, fall back to profile-based storage
        if (isTableNotFoundError(error) && body.profile_id) {
          const fallbackWallet = await addFallbackProfileWallet(supabase, body.profile_id, {
            label: sanitized.label,
            description: sanitized.description || null,
            address_or_xpub: sanitized.address_or_xpub,
            wallet_type: walletType,
            category: sanitized.category,
            category_icon: sanitized.category_icon || '💰',
            behavior_type: body.behavior_type || 'general',
            budget_amount: body.budget_amount || null,
            budget_period: body.budget_period || null,
            goal_amount: sanitized.goal_amount || null,
            goal_currency: sanitized.goal_currency || null,
            goal_deadline: sanitized.goal_deadline || null,
            is_primary: body.is_primary !== undefined ? body.is_primary : isFirstWallet,
          });

          return NextResponse.json(fallbackWallet, { status: 201 });
        }

        return handleSupabaseError('create wallet', error, { entityId });
      }

      return NextResponse.json(wallet, { status: 201 });
    } catch (insertError: unknown) {
      // If the wallets table truly does not exist, fall back to profile metadata storage
      if (isTableNotFoundError(insertError) && body.profile_id) {
        const fallbackWallet = await addFallbackProfileWallet(supabase, body.profile_id, {
          label: sanitized.label,
          description: sanitized.description || null,
          address_or_xpub: sanitized.address_or_xpub,
          wallet_type: walletType,
          category: sanitized.category,
          category_icon: sanitized.category_icon || '💰',
          behavior_type: body.behavior_type || 'general',
          budget_amount: body.budget_amount || null,
          budget_period: body.budget_period || null,
          goal_amount: sanitized.goal_amount || null,
          goal_currency: sanitized.goal_currency || null,
          goal_deadline: sanitized.goal_deadline || null,
          is_primary: body.is_primary !== undefined ? body.is_primary : isFirstWallet,
        });

        return NextResponse.json(fallbackWallet, { status: 201 });
      }

      return handleSupabaseError('create wallet', insertError, { entityId });
    }
  } catch (error) {
    return handleSupabaseError('create wallet', error);
  }
}
