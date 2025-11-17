import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import {
  WalletFormData,
  validateWalletFormData,
  sanitizeWalletInput,
  validateAddressOrXpub,
  detectWalletType,
} from '@/types/wallet';

interface ErrorResponse {
  error: string;
  code?: string;
  field?: string;
}

// GET /api/wallets?profile_id=xxx OR ?project_id=xxx
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
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid ID format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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
      console.error('Error fetching wallets:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch wallets', code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ wallets: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', body.profile_id)
        .single();

      if (!profile || profile.user_id !== user.id) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Forbidden', code: 'FORBIDDEN' },
          { status: 403 }
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

    // Check for duplicate address/xpub for this entity
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

    // Transaction: Check count and insert atomically
    // Note: The trigger will enforce the 10-wallet limit
    // But we can provide better error message by checking first
    const { data: existingWallets } = await supabase
      .from('wallets')
      .select('id')
      .eq(body.profile_id ? 'profile_id' : 'project_id', entityId)
      .eq('is_active', true);

    const walletCount = existingWallets?.length || 0;
    const isFirstWallet = walletCount === 0;

    if (walletCount >= 10) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Maximum 10 wallets allowed per profile/project', code: 'WALLET_LIMIT_REACHED' },
        { status: 400 }
      );
    }

    // Create wallet
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
      console.error('Error creating wallet:', error);

      // Check for specific error messages
      if (error.message.includes('Maximum 10')) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Maximum 10 wallets allowed', code: 'WALLET_LIMIT' },
          { status: 400 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to create wallet', code: 'CREATE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error) {
    console.error('Wallet creation error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
