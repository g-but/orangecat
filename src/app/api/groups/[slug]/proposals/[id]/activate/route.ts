import {
  handleApiError,
  apiSuccess,
  apiBadRequest,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { activateProposal } from '@/services/groups/mutations/proposals';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ slug: string; id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const result = await activateProposal(id, supabase);
    if (!result.success) {
      return apiBadRequest(result.error);
    }
    return apiSuccess(result.proposal);
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals/[id]/activate', error, 'API');
    return handleApiError(error);
  }
});
