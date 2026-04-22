/**
 * Group Members API Route
 *
 * Handles member operations for a group.
 * Uses unified GroupsService.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored POST to use withAuth middleware
 */

import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import groupsService from '@/services/groups';
import { logger } from '@/utils/logger';
import { apiSuccess, apiCreated, apiNotFound, apiInternalError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  try {
    const { user } = request;
    const { slug } = await context.params;

    // Get group first
    const groupResult = await groupsService.getGroup(slug, !!user);
    if (!groupResult.success || !groupResult.group) {
      return apiNotFound('Group not found');
    }

    // Get members
    const membersResult = await groupsService.getGroupMembers(groupResult.group.id);

    if (!membersResult.success) {
      return apiInternalError(membersResult.error || 'Failed to fetch members');
    }

    return apiSuccess({
      members: membersResult.members || [],
      total: membersResult.total || 0,
    });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]/members:', error);
    return apiInternalError('Internal server error');
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { slug } = await context.params;
    const { user } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const _body = await request.json();

    // Get group first
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return apiNotFound('Group not found');
    }

    // Join group
    const result = await groupsService.joinGroup(groupResult.group.id);

    if (!result.success) {
      return apiInternalError(result.error || 'Failed to join group');
    }

    return apiCreated({ success: true, message: 'Successfully joined group' });
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/members:', error);
    return apiInternalError('Internal server error');
  }
});
