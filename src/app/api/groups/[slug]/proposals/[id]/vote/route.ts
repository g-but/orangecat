/**
 * Proposal Vote API
 *
 * POST /api/groups/[slug]/proposals/[id]/vote - Cast a vote on a proposal
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { handleApiError, apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { logger } from '@/utils/logger';
import { castVote } from '@/services/groups/mutations/votes';
import { z } from 'zod';

const voteBodySchema = z.object({
  vote: z.enum(['yes', 'no', 'abstain']),
});

interface RouteContext {
  params: Promise<{ slug: string; id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'proposal ID'));
    if (idValidation) { return idValidation; }
    const { user } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many vote requests. Please slow down.', retryAfter);
    }

    const { supabase } = request;
    const body = await request.json();
    const parsed = voteBodySchema.safeParse(body);
    if (!parsed.success) {return apiBadRequest('vote must be one of: yes, no, abstain');}
    const result = await castVote({ proposal_id: id, vote: parsed.data.vote }, supabase);
    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return apiBadRequest((result as any).error);
    }
    return apiSuccess(result.vote);
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals/[id]/vote', error, 'API');
    return handleApiError(error);
  }
});
