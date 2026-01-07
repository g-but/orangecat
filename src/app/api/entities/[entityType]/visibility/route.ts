/**
 * Entity Visibility Toggle API
 *
 * Toggle show_on_profile for entities.
 * Supports single item and bulk updates.
 *
 * PATCH /api/entities/[entityType]/visibility
 * Body: { ids: string[], show_on_profile: boolean }
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized } from '@/lib/api/standardResponse';
import { isValidEntityType, getTableName, getUserIdField, EntityType } from '@/config/entity-registry';
import { logger } from '@/utils/logger';
import { z } from 'zod';

// Request body schema
const visibilityUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID required'),
  show_on_profile: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> }
) {
  try {
    const { entityType } = await params;

    // Validate entity type
    if (!isValidEntityType(entityType)) {
      return apiBadRequest(`Invalid entity type: ${entityType}`);
    }

    // Get authenticated user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized('Authentication required');
    }

    // Parse request body
    const body = await request.json();
    const parseResult = visibilityUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.errors[0].message);
    }

    const { ids, show_on_profile } = parseResult.data;
    const tableName = getTableName(entityType as EntityType);
    const userIdField = getUserIdField(entityType as EntityType);

    // Update entities - RLS ensures user can only update their own
    const { data, error } = await supabase
      .from(tableName)
      .update({ show_on_profile, updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq(userIdField, user.id)
      .select('id');

    if (error) {
      logger.error('Failed to update entity visibility', {
        entityType,
        ids,
        error: error.message,
      });
      return apiError('Failed to update visibility');
    }

    const updatedCount = data?.length || 0;

    logger.info('Entity visibility updated', {
      entityType,
      userId: user.id,
      requestedCount: ids.length,
      updatedCount,
      show_on_profile,
    });

    return apiSuccess({
      message: `${updatedCount} ${entityType}${updatedCount !== 1 ? 's' : ''} ${show_on_profile ? 'shown on' : 'hidden from'} profile`,
      updatedCount,
      show_on_profile,
    });
  } catch (error) {
    logger.error('Unexpected error in visibility toggle', { error });
    return apiError('Failed to update visibility');
  }
}
