/**
 * Allocation lines — GET the split, PUT to replace it.
 *
 * A separate resource from the directive itself because the two obey different
 * rules: the directive's fields are independent of one another, while the lines
 * are only valid as a SET (they must total 100% before the directive can leave
 * draft). Replacing the set in one request is what makes that checkable at all
 * — a per-line endpoint would force every edit through states no rule can
 * describe.
 */

import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiForbidden,
  apiValidationError,
  handleApiError,
  apiBadRequest,
} from '@/lib/api/standardResponse';
import { validateUUID } from '@/lib/api/validation';
import { fromTable } from '@/lib/supabase/untyped';
import { getTableName } from '@/config/entity-registry';
import { checkOwnership } from '@/services/actors';
import { CivicAllocationService, UnbalancedAllocationError } from '@/domain/civic/service';
import { allocationLinesPayloadSchema } from '@/lib/validation/civic';
import {
  rateLimitWriteAsync,
  createRateLimitResponse,
  applyRateLimitHeaders,
} from '@/lib/rate-limit';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ALLOCATIONS_TABLE = getTableName('allocation');

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  const { id } = await context.params;
  if (!validateUUID(id)) {
    return apiBadRequest('Invalid allocation id');
  }

  try {
    // RLS decides visibility: a private directive simply is not there for a
    // reader who does not own it, so no separate permission branch is needed.
    const service = new CivicAllocationService(request.supabase);
    const lines = await service.getResolvedLines(id);
    return apiSuccess({ lines });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  if (!validateUUID(id)) {
    return apiBadRequest('Invalid allocation id');
  }

  // Before any read: rewriting a split is several statements against two tables,
  // and on a published directive it briefly demotes the parent. That is not work
  // to do at whatever rate a caller asks for.
  const rateLimit = await rateLimitWriteAsync(request.user.id);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit) as ReturnType<typeof apiSuccess>;
  }

  try {
    const { data: allocation, error } = await fromTable(request.supabase, ALLOCATIONS_TABLE)
      .select('id, actor_id, status')
      .eq('id', id)
      .maybeSingle();

    if (error || !allocation) {
      return apiNotFound('Allocation');
    }

    const owns = await checkOwnership(
      allocation as { actor_id: string | null },
      request.user.id,
      request.supabase
    );
    if (!owns) {
      return apiForbidden('You can only edit your own allocation');
    }

    const body = await request.json();
    const parsed = allocationLinesPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError('Invalid allocation lines', parsed.error.flatten());
    }

    const service = new CivicAllocationService(request.supabase);
    const lines = await service.replaceLines(id, parsed.data.lines);

    logger.info('Allocation lines replaced', { allocationId: id, lineCount: lines.length });
    return applyRateLimitHeaders(apiSuccess({ lines }), rateLimit);
  } catch (error) {
    // The balance rule is the one failure a person caused and can fix, so it
    // comes back as a 400 they can read rather than a 500 they cannot.
    if (error instanceof UnbalancedAllocationError) {
      return apiBadRequest(error.message);
    }
    return handleApiError(error);
  }
});
