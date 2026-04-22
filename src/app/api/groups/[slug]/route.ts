/**
 * Unified Group Detail API Route
 *
 * Handles GET, PUT, DELETE operations for a specific group by slug.
 * Uses unified GroupsService.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored PUT/DELETE to use withAuth middleware
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import groupsService from '@/services/groups';
import { updateGroupSchema } from '@/services/groups/validation';
import { logger } from '@/utils/logger';
import type { UpdateGroupInput } from '@/types/group';
import {
  apiSuccess,
  apiNotFound,
  apiBadRequest,
  apiForbidden,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    // Get group by slug (second param is bySlug=true)
    const result = await groupsService.getGroup(slug, true);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return apiNotFound('Group not found');
      }
      return apiInternalError(result.error || 'Failed to fetch group');
    }

    return apiSuccess({ group: result.group });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]:', error);
    return apiInternalError();
  }
}

export const PUT = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { user } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const { slug } = await context.params;
    const body = await request.json();

    // Validate request
    const validationResult = updateGroupSchema.safeParse(body);
    if (!validationResult.success) {
      return apiBadRequest('Invalid request', validationResult.error.errors);
    }

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return apiNotFound('Group not found');
    }

    // Check if user has permission to update
    const canUpdate = await groupsService.checkGroupPermission(
      groupResult.group.id,
      user.id,
      'canManageSettings'
    );

    if (!canUpdate) {
      return apiForbidden('You do not have permission to update this group');
    }

    // Update group
    const result = await groupsService.updateGroup(
      groupResult.group.id,
      validationResult.data as UpdateGroupInput
    );

    if (!result.success) {
      return apiInternalError(result.error || 'Failed to update group');
    }

    return apiSuccess({ group: result.group });
  } catch (error) {
    logger.error('Error in PUT /api/groups/[slug]:', error);
    return apiInternalError();
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { user } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const { slug } = await context.params;

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return apiNotFound('Group not found');
    }

    // Check if user is owner
    if (groupResult.group.created_by !== user.id) {
      return apiForbidden('Only the owner can delete this group');
    }

    // Delete group
    const result = await groupsService.deleteGroup(groupResult.group.id);

    if (!result.success) {
      return apiInternalError(result.error || 'Failed to delete group');
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/groups/[slug]:', error);
    return apiInternalError();
  }
});
