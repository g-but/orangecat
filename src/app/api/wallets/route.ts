import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import { WalletFormData, detectWalletType, validateAddressOrXpub } from '@/types/wallet';

// GET /api/wallets?profile_id=xxx OR ?project_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profile_id');
    const projectId = searchParams.get('project_id');

    if (!profileId && !projectId) {
      return NextResponse.json({ error: 'profile_id or project_id required' }, { status: 400 });
    }

    let query = supabase.from('wallets').select('*').eq('is_active', true).order('display_order', { ascending: true });

    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching wallets:', error);
      return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
    }

    return NextResponse.json({ wallets: data || [] });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallets - Create new wallet
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as WalletFormData & { profile_id?: string; project_id?: string };

    // Validate
    if (!body.profile_id && !body.project_id) {
      return NextResponse.json({ error: 'profile_id or project_id required' }, { status: 400 });
    }

    if (!body.label?.trim()) {
      return NextResponse.json({ error: 'Wallet label is required' }, { status: 400 });
    }

    const validation = validateAddressOrXpub(body.address_or_xpub);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid address or xpub' }, { status: 400 });
    }

    // Verify ownership
    if (body.profile_id) {
      const { data: profile } = await supabase.from('profiles').select('user_id').eq('id', body.profile_id).single();
      if (!profile || profile.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (body.project_id) {
      const { data: project } = await supabase.from('projects').select('user_id').eq('id', body.project_id).single();
      if (!project || project.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Check if this is the first wallet (make it primary)
    const { data: existingWallets } = await supabase
      .from('wallets')
      .select('id')
      .eq(body.profile_id ? 'profile_id' : 'project_id', body.profile_id || body.project_id)
      .eq('is_active', true);

    const isFirstWallet = !existingWallets || existingWallets.length === 0;

    // Detect wallet type
    const walletType = detectWalletType(body.address_or_xpub);

    // Create wallet
    const { data: wallet, error } = await supabase
      .from('wallets')
      .insert({
        profile_id: body.profile_id || null,
        project_id: body.project_id || null,
        label: body.label.trim(),
        description: body.description?.trim() || null,
        address_or_xpub: body.address_or_xpub.trim(),
        wallet_type: walletType,
        category: body.category || 'general',
        category_icon: body.category_icon || '💰',
        goal_amount: body.goal_amount || null,
        goal_currency: body.goal_currency || null,
        goal_deadline: body.goal_deadline || null,
        is_primary: body.is_primary || isFirstWallet,
        balance_btc: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet:', error);
      return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
    }

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error) {
    console.error('Wallet creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
