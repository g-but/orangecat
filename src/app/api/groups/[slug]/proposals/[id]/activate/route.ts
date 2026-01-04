import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, apiUnauthorized, apiSuccess } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { activateProposal } from '@/services/groups/mutations/proposals';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const { id } = params;
    const result = await activateProposal(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return apiSuccess(result.proposal);
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals/[id]/activate', error, 'API');
    return handleApiError(error);
  }
}

