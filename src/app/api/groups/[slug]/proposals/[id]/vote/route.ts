import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, apiUnauthorized, apiSuccess } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { castVote } from '@/services/groups/mutations/votes';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {return apiUnauthorized();}

    const { id } = params;
    const body = await request.json();
    const result = await castVote({ proposal_id: id, vote: body.vote });
    if (!result.success) {
      return NextResponse.json({ error: (result as any).error }, { status: 400 });
    }
    return apiSuccess(result.vote);
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals/[id]/vote', error, 'API');
    return handleApiError(error);
  }
}

