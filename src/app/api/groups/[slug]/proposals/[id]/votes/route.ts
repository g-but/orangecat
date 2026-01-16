/**
 * Proposal Votes API
 *
 * GET /api/groups/[slug]/proposals/[id]/votes - Get all votes for a proposal
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { getProposalVotes } from '@/services/groups/queries/proposals';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user: _user },
    } = await supabase.auth.getUser();

    // Optional auth - public proposals can be viewed by anyone
    // But votes are only visible to members
    const { id } = await params;
    const result = await getProposalVotes(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // Filter votes if not authenticated or not a member
    // For now, return all votes (RLS should handle this)
    return apiSuccess({ votes: result.votes || [] });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]/proposals/[id]/votes', error, 'API');
    return handleApiError(error);
  }
}
