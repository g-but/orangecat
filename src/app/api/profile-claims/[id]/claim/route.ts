/**
 * POST /api/profile-claims/[id]/claim — claim a pre-drafted profile.
 * Authenticated: the caller must already have (or have just created) their
 * own OrangeCat account. Copies the draft onto the caller's own profile.
 *
 * Thin HTTP layer — business rules live in @/domain/profileClaims/service.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiConflict,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { claimProfileClaim } from '@/domain/profileClaims/service';

export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const idValidation = getValidationError(validateUUID(id, 'claim id'));
    if (idValidation) {
      return idValidation;
    }

    try {
      const { user, supabase } = req;
      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
      }

      const result = await claimProfileClaim({
        claimId: id,
        userId: user.id,
        userSupabase: supabase,
      });

      if (!result.ok) {
        if ('dbError' in result) {
          return handleApiError(result.dbError);
        }
        if (result.code === 'not_found') {
          return apiNotFound(result.message);
        }
        // expired / already_claimed / revoked — the link is understood, just unusable.
        return apiConflict(result.message);
      }

      return apiSuccess({ username: result.data.username });
    } catch (error) {
      logger.error('profile-claim claim failed', { error, id }, 'ProfileClaims');
      return handleApiError(error);
    }
  }
);
