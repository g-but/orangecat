/**
 * Proposal Votes API
 *
 * GET /api/groups/[slug]/proposals/[id]/votes - Get all votes for a proposal
 */

import { handleApiError, apiSuccess, apiNotFound } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { getProposalVotes } from '@/services/groups/queries/proposals';
import { withOptionalAuth } from '@/lib/api/withAuth';

interface RouteContext {
  params: Promise<{ slug: string; id: string }>;
}

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'proposal ID'));
  if (idValidation) {return idValidation;}
  try {
    // Optional auth - public proposals can be viewed by anyone
    // But votes are only visible to members (RLS handles access via request.supabase)
    const result = await getProposalVotes(id, request.supabase);
    if (!result.success) {
      return apiNotFound(result.error);
    }

    return apiSuccess({ votes: result.votes || [] });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]/proposals/[id]/votes', error, 'API');
    return handleApiError(error);
  }
});
