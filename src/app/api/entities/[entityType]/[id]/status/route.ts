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
import {
  isValidEntityType,
  getTableName,
  getUserIdField,
  type EntityType,
} from '@/config/entity-registry';
import { type EntityStatus } from '@/config/status-config';
import { z } from 'zod';
import { checkOwnership } from '@/services/actors';

// Valid status values
const VALID_STATUSES: EntityStatus[] = [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled',
  'archived',
];

// Valid status transitions for general entities
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

    // Validate entity type
    if (!isValidEntityType(entityType)) {
      return apiBadRequest(`Invalid entity type: ${entityType}`);
    }

    // Rate limiting check
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      return apiRateLimited(
        'Too many requests',
        rateLimitResult.resetTime
          ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          : undefined
      );
    }

    const { user, supabase } = request;

    // Parse request body
    const body = await request.json();
    const parseResult = statusUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return apiValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const { status: newStatus } = parseResult.data;
    const tableName = getTableName(entityType as EntityType);
    const userIdField = getUserIdField(entityType as EntityType);

    // Fetch current entity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase.from(tableName) as any)
      .select('id, status, ' + userIdField)
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return apiNotFound(`${entityType} not found`);
    }

    // Check ownership - handle both actor_id and user_id patterns
    if (userIdField === 'actor_id') {
      const hasAccess = await checkOwnership(existing as { actor_id: string }, user.id);
      if (!hasAccess) {
        return apiNotFound(`${entityType} not found`);
      }
    } else {
      // For user_id, profile_id, created_by etc.
      if (existing[userIdField] !== user.id) {
        return apiNotFound(`${entityType} not found`);
      }
    }

    // Check if transition is valid
    const currentStatus = (existing.status || 'draft').toLowerCase();
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return apiValidationError(
        `Cannot change status from '${currentStatus}' to '${newStatus}'. ` +
          `Allowed: ${allowedTransitions.join(', ') || 'none'}`
      );
    }

    // Update status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase.from(tableName) as any)
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return handleSupabaseError(updateError);
    }

    logger.info(`Entity status changed: ${entityType} ${id}`, {
      userId: user.id,
      entityType,
      entityId: id,
      oldStatus: currentStatus,
      newStatus,
    });

    return applyRateLimitHeaders(apiSuccess(updated), rateLimitResult);
  } catch (error) {
    return handleApiError(error);
  }
});
