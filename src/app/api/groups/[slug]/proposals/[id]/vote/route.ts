/**
 * Proposal Vote API
 *
 * POST /api/groups/[slug]/proposals/[id]/vote - Cast a vote on a proposal
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextResponse } from 'next/server';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { logger } from '@/utils/logger';
import { castVote } from '@/services/groups/mutations/votes';

interface RouteContext {
  params: Promise<{ slug: string; id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = await castVote({ proposal_id: id, vote: body.vote });
    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json({ error: (result as any).error }, { status: 400 });
    }
    return apiSuccess(result.vote);
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals/[id]/vote', error, 'API');
    return handleApiError(error);
  }
});
