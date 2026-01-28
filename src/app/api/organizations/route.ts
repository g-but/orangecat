/**
 * Organizations API Route - Backward Compatibility Wrapper
 *
 * Uses unified groups API, filtering out circles.
 * Maintains backward compatibility for existing clients.
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextResponse } from 'next/server';
import groupsService from '@/services/groups';
import { createGroupSchema } from '@/services/groups/validation';
import { logger } from '@/utils/logger';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/standardResponse';
import type { CreateGroupInput } from '@/types/group';

// GET /api/organizations - Get organizations (exclude circles)
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get('filter'); // 'my' for user's orgs
    const pageSize = parseInt(searchParams.get('limit') || '20');

    if (filter === 'my' && user) {
      // Get user's groups, filter out circles (userId obtained internally)
      const result = await groupsService.getUserGroups({}, { page: 1, pageSize });

      if (!result.success) {
        return apiError(result.error || 'Failed to fetch organizations');
      }

      // Filter out circles (label === 'circle')
      const organizations = (result.groups || []).filter(g => g.label !== 'circle');

      return apiSuccess({
        organizations,
        count: organizations.length,
      });
    } else {
      // Get available groups (public), filter out circles
      const result = await groupsService.getAvailableGroups(
        { is_public: true },
        { page: 1, pageSize }
      );

      if (!result.success) {
        return apiError(result.error || 'Failed to fetch organizations');
      }

      // Filter out circles (label === 'circle')
      const organizations = (result.groups || []).filter(g => g.label !== 'circle');

      return apiSuccess({
        organizations,
        count: organizations.length,
      });
    }
  } catch (error) {
    logger.error('Error in GET /api/organizations', { error }, 'Organizations');
    return apiError('Internal server error');
  }
});

// POST /api/organizations - Create organization
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    // Validate and ensure type is NOT 'circle'
    const validationResult = createGroupSchema.safeParse({
      ...body,
      type: body.type && body.type !== 'circle' ? body.type : 'organization',
    });

    if (!validationResult.success) {
      return apiBadRequest('Invalid request', validationResult.error.errors);
    }

    // Create group (organization)
    const result = await groupsService.createGroup(validationResult.data as CreateGroupInput);

    if (!result.success) {
      return apiError(result.error || 'Failed to create organization');
    }

    return NextResponse.json({ success: true, organization: result.group }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/organizations', { error }, 'Organizations');
    return apiError('Internal server error');
  }
});
