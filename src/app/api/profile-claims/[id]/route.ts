/**
 * GET    /api/profile-claims/[id] — public claim preview (no auth: this is
 *   what a recipient with no account yet sees before they sign up).
 * DELETE /api/profile-claims/[id] — revoke a still-pending claim (creator only).
 *
 * Thin HTTP layer — business rules live in @/domain/profileClaims/service.
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds, rateLimit } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { getProfileClaimPreview, revokeProfileClaim } from '@/domain/profileClaims/service';
import type { ProfileClaimResult } from '@/domain/profileClaims/types';

function toErrorResponse<T>(result: Extract<ProfileClaimResult<T>, { ok: false }>) {
  if ('dbError' in result) {
    return handleApiError(result.dbError);
  }
  if (result.code === 'not_found') {
    return apiNotFound(result.message);
  }
  return apiValidationError(result.message);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idValidation = getValidationError(validateUUID(id, 'claim id'));
  if (idValidation) {
    return idValidation;
  }

  try {
    const rl = await rateLimit(req);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
    }

    const result = await getProfileClaimPreview(id);
    if (!result.ok) {
      return toErrorResponse(result);
    }
    return apiSuccess(result.data);
  } catch (error) {
    logger.error('profile-claim preview failed', { error, id }, 'ProfileClaims');
    return handleApiError(error);
  }
}

export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const idValidation = getValidationError(validateUUID(id, 'claim id'));
    if (idValidation) {
      return idValidation;
    }

    try {
      const { user } = req;
      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
      }

      const result = await revokeProfileClaim(id, user.id);
      if (!result.ok) {
        return toErrorResponse(result);
      }
      return apiSuccess({ revoked: true });
    } catch (error) {
      logger.error('profile-claim revoke failed', { error, id }, 'ProfileClaims');
      return handleApiError(error);
    }
  }
);
