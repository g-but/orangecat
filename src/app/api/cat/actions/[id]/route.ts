/**
 * My Cat Pending Action API
 *
 * Endpoints for confirming or rejecting pending actions.
 *
 * POST /api/cat/actions/[id] - Confirm a pending action
 * DELETE /api/cat/actions/[id] - Reject a pending action
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

import { NextRequest } from 'next/server';
import { createActionExecutor } from '@/services/cat';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { apiNotFound } from '@/lib/api/standardResponse';
import { getUserActorId } from '@/domain/actors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/cat/actions/[id]
 * Confirm and execute a pending action
 */
export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteParams) => {
  const { id: pendingActionId } = await context.params;
  const idValidation = getValidationError(validateUUID(pendingActionId, 'action ID'));
  if (idValidation) {return idValidation;}

  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

    // Get user's actor ID
    const actorId = await getUserActorId(supabase, user.id);
    if (!actorId) {
      return apiNotFound('Actor not found');
    }

    const executor = createActionExecutor(supabase);
    const result = await executor.confirmPendingAction(user.id, actorId, pendingActionId);

    if (result.success) {
      return apiSuccess(result);
    } else {
      return apiBadRequest(result.error);
    }
  } catch (error) {
    logger.error('Confirm pending action error', error, 'CatActionsAPI');
    return apiInternalError('Failed to confirm action');
  }
});

/**
 * DELETE /api/cat/actions/[id]
 * Reject a pending action
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteParams) => {
  const { id: pendingActionId } = await context.params;
  const idValidation = getValidationError(validateUUID(pendingActionId, 'action ID'));
  if (idValidation) {return idValidation;}

  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

    // Get optional rejection reason from body (max 500 chars)
    let reason: string | undefined;
    try {
      const body = await (request as NextRequest).json();
      if (typeof body.reason === 'string') {
        reason = body.reason.slice(0, 500) || undefined;
      }
    } catch {
      // Body is optional
    }

    const executor = createActionExecutor(supabase);
    await executor.rejectPendingAction(user.id, pendingActionId, reason);

    return apiSuccess({ rejected: true });
  } catch (error) {
    logger.error('Reject pending action error', error, 'CatActionsAPI');
    return apiInternalError('Failed to reject action');
  }
});
