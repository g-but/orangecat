/**
 * Generic Entity Status API
 *
 * PATCH /api/entities/[entityType]/[id]/status - Update entity status
 *
 * Supports all entity types via entity-registry. Validates ownership
 * and status transitions.
 *
 * Created: 2026-03-28
 */

import {
  apiSuccess,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
  apiBadRequest,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { rateLimit, applyRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { isValidEntityType, getTableName, getUserIdField, type EntityType } from '@/config/entity-registry';
import { z } from 'zod';
import { checkOwnership } from '@/services/actors';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['paused', 'draft', 'archived'],
  paused: ['active', 'draft'],
  completed: ['draft'],
  cancelled: ['draft'],
  archived: ['draft'],
};

const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled', 'archived']),
});

interface RouteContext {
  params: Promise<{ entityType: string; id: string }>;
}

export const PATCH = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { entityType, id } = await context.params;
    if (!isValidEntityType(entityType)) {return apiBadRequest(`Invalid entity type: ${entityType}`);}

    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return apiRateLimited('Too many requests', rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : undefined);
    }

    const { user, supabase } = request;
    const body = await request.json();
    const parseResult = statusUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return apiValidationError(`Invalid status. Must be one of: ${Object.keys(VALID_TRANSITIONS).join(', ')}`);
    }

    const { status: newStatus } = parseResult.data;
    const tableName = getTableName(entityType as EntityType);
    const userIdField = getUserIdField(entityType as EntityType);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase.from(tableName) as any)
      .select('id, status, ' + userIdField)
      .eq('id', id)
      .single();

    if (fetchError || !existing) {return apiNotFound(`${entityType} not found`);}

    const hasAccess = userIdField === 'actor_id'
      ? await checkOwnership(existing as { actor_id: string }, user.id)
      : existing[userIdField] === user.id;
    if (!hasAccess) {return apiNotFound(`${entityType} not found`);}

    const currentStatus = (existing.status || 'draft').toLowerCase();
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return apiValidationError(
        `Cannot change status from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase.from(tableName) as any)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (updateError) {return handleSupabaseError(updateError);}

    logger.info(`Entity status changed: ${entityType} ${id}`, { userId: user.id, oldStatus: currentStatus, newStatus });
    return applyRateLimitHeaders(apiSuccess(updated), rateLimitResult);
  } catch (error) {
    return handleApiError(error);
  }
});
