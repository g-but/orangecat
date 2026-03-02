/**
 * Organization Detail API Route - Backward Compatibility Wrapper
 *
 * Uses unified groups service. Looks up organization by ID to get slug,
 * then calls unified groups API.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Updated to use unified groups API
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import groupsService from '@/services/groups';
import { getUserRole } from '@/services/groups/utils/helpers';
import { STATUS } from '@/config/database-constants';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  apiInternalError,
} from '@/lib/api/standardResponse';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getOrgSlugById(id: string): Promise<string | null> {
  const supabase = await createServerClient();

  const { data: org } = await (
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.GROUPS) as any
  )
    .select('slug')
    .eq('id', id)
    .single();

  return org?.slug || null;
}

// GET /api/organizations/[id] - Get organization by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const slug = await getOrgSlugById(id);

    if (!slug) {
      return apiNotFound('Organization not found');
    }

    // Use unified groups service
    const result = await groupsService.getGroup(slug, true);

    if (!result.success) {
      return result.error?.includes('not found')
        ? apiNotFound(result.error || 'Failed to fetch organization')
        : apiInternalError(result.error || 'Failed to fetch organization');
    }

    return apiSuccess({ group: result.group });
  } catch (error) {
    logger.error('Error in GET /api/organizations/[id]', { error }, 'Organizations');
    return apiInternalError();
  }
}

// PUT /api/organizations/[id] - Update organization
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth guard: require authenticated user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const slug = await getOrgSlugById(id);

    if (!slug) {
      return apiNotFound('Organization not found');
    }

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return apiNotFound('Organization not found');
    }

    // Authorization: only founders and admins can update
    const role = await getUserRole(groupResult.group.id, user.id);
    if (role !== STATUS.GROUP_MEMBERS.FOUNDER && role !== STATUS.GROUP_MEMBERS.ADMIN) {
      return apiForbidden('Must be founder or admin to update organization');
    }

    const body = await request.json();
    // Ensure type is NOT 'circle' (organizations only)
    const bodyWithType = {
      ...body,
      type: body.type && body.type !== 'circle' ? body.type : 'organization',
    };

    // Update using unified service
    const result = await groupsService.updateGroup(groupResult.group.id, bodyWithType);

    if (!result.success) {
      return apiInternalError(result.error || 'Failed to update organization');
    }

    return apiSuccess({ group: result.group });
  } catch (error) {
    logger.error('Error in PUT /api/organizations/[id]', { error }, 'Organizations');
    return apiInternalError();
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth guard: require authenticated user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const slug = await getOrgSlugById(id);

    if (!slug) {
      return apiNotFound('Organization not found');
    }

    // Get group first to check permissions
    const groupResult = await groupsService.getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return apiNotFound('Organization not found');
    }

    // Authorization: only founders can delete
    const role = await getUserRole(groupResult.group.id, user.id);
    if (role !== STATUS.GROUP_MEMBERS.FOUNDER) {
      return apiForbidden('Only the founder can delete an organization');
    }

    // Delete using unified service
    const result = await groupsService.deleteGroup(groupResult.group.id);

    if (!result.success) {
      return apiInternalError(result.error || 'Failed to delete organization');
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/organizations/[id]', { error }, 'Organizations');
    return apiInternalError();
  }
}
