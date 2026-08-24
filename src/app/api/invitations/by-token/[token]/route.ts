/**
 * GET  /api/invitations/by-token/[token] — public preview of a join link
 * POST /api/invitations/by-token/[token] — accept invitation (auth required)
 *
 * Created: 2026-08-20
 * Last Modified: 2026-08-20
 * Last Modified Summary: Token join API for /organizations/join/[token]
 */

import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiUnauthorized,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { getInvitationByToken } from '@/services/groups/queries/invitations';
import { acceptInvitationByToken } from '@/services/groups/mutations/invitations';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ token: string }>;
}

function sanitizeToken(raw: string): string | null {
  const token = decodeURIComponent(raw).trim();
  if (!token || token.length > 200) {
    return null;
  }
  return token;
}

export const GET = withOptionalAuth(async (_request, context: RouteContext) => {
  try {
    const { token: raw } = await context.params;
    const token = sanitizeToken(raw);
    if (!token) {
      return apiBadRequest('Invalid invitation token');
    }

    const result = await getInvitationByToken(token);
    if (!result.success || !result.invitation) {
      return apiNotFound(result.error ?? 'Invitation not found');
    }

    return apiSuccess({ invitation: result.invitation });
  } catch (error) {
    logger.error('GET invitation by token failed', error, 'API');
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { user, supabase } = request;
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
    }

    const { token: raw } = await context.params;
    const token = sanitizeToken(raw);
    if (!token) {
      return apiBadRequest('Invalid invitation token');
    }

    const result = await acceptInvitationByToken(token, supabase);
    if (!result.success) {
      if (result.error === 'Authentication required') {
        return apiUnauthorized(result.error);
      }
      return apiBadRequest(result.error ?? 'Could not accept invitation');
    }

    return apiSuccess({
      message: 'Invitation accepted',
      group_id: result.group_id,
    });
  } catch (error) {
    logger.error('POST accept invitation by token failed', error, 'API');
    return handleApiError(error);
  }
});
