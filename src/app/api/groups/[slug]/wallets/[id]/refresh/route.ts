/**
 * Refresh Wallet Balance API
 *
 * POST /api/groups/[slug]/wallets/[id]/refresh - Refresh wallet balance from blockchain
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import {
  handleApiError,
  apiSuccess,
  apiNotFound,
  apiForbidden,
  apiBadRequest,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { logger } from '@/utils/logger';
import { refreshWalletBalance } from '@/services/groups/mutations/treasury';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { checkGroupPermission } from '@/services/groups/permissions';
import { getGroupBySlug } from '@/services/groups/queries/groups';

interface RouteContext {
  params: Promise<{ slug: string; id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { slug, id: walletId } = await context.params;
  const idValidation = getValidationError(validateUUID(walletId, 'wallet ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = retryAfterSeconds(rl);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    // Get group
    const groupResult = await getGroupBySlug(slug, supabase);
    if (!groupResult.success || !groupResult.group) {
      return apiNotFound('Group not found');
    }

    // Check permissions
    const canView = await checkGroupPermission(groupResult.group.id, user.id, 'canView', supabase);
    if (!canView) {
      return apiForbidden('Insufficient permissions');
    }

    // Refresh balance
    const result = await refreshWalletBalance(walletId, supabase);

    if (!result.success) {
      return apiBadRequest(result.error);
    }

    return apiSuccess({ balance: result.balance });
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/wallets/[id]/refresh', error, 'API');
    return handleApiError(error);
  }
});
