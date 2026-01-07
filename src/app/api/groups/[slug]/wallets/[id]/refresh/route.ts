/**
 * Refresh Wallet Balance API
 *
 * POST /api/groups/[slug]/wallets/[id]/refresh - Refresh wallet balance from blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, apiUnauthorized, apiSuccess } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { refreshWalletBalance } from '@/services/groups/mutations/treasury';
import { createServerClient } from '@/lib/supabase/server';
import { checkGroupPermission } from '@/services/groups/permissions';
import { getGroupBySlug } from '@/services/groups/queries/groups';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: walletId } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {return apiUnauthorized();}

    // Get group
    const groupResult = await getGroupBySlug(slug);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check permissions
    const canView = await checkGroupPermission(groupResult.group.id, user.id, 'canView');
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Refresh balance
    const result = await refreshWalletBalance(walletId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return apiSuccess({ balance: result.balance });
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/wallets/[id]/refresh', error, 'API');
    return handleApiError(error);
  }
}

