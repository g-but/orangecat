/**
 * Project collaborator-roles API.
 *
 * GET  /api/project-roles?skill=&engagement_type=  — the public open-roles board.
 * POST /api/project-roles  { project_id, role_title, skills[], engagement_type, description }
 *      — create a role (project owner only).
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { getAuthenticatedUserId } from '@/lib/api/authHelpers';
import { isEngagementType } from '@/config/project-roles';
import {
  listOpenRoles,
  createRole,
  RoleForbiddenError,
  RoleValidationError,
} from '@/services/collaboration/projectRoles';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const skill = url.searchParams.get('skill') || undefined;
    const engagementParam = url.searchParams.get('engagement_type') || undefined;
    const engagementType = isEngagementType(engagementParam) ? engagementParam : undefined;

    const roles = await listOpenRoles({ skill, engagementType });
    return apiSuccess({ roles });
  } catch (error) {
    logger.error('Failed to list project roles', error, 'ProjectRoles');
    return apiError('Failed to load roles', 'ROLES_LIST_FAILED', 500);
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }
  const rl = await rateLimitWriteAsync(userId);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const role = await createRole(
      {
        projectId: String(body.project_id ?? ''),
        roleTitle: String(body.role_title ?? ''),
        skills: Array.isArray(body.skills) ? (body.skills as string[]) : [],
        engagementType: typeof body.engagement_type === 'string' ? body.engagement_type : undefined,
        description: typeof body.description === 'string' ? body.description : null,
      },
      userId
    );
    return apiSuccess({ role }, { status: 201 });
  } catch (error) {
    if (error instanceof RoleForbiddenError) {
      return apiError(error.message, 'FORBIDDEN', 403);
    }
    if (error instanceof RoleValidationError) {
      return apiError(error.message, 'VALIDATION', 400);
    }
    logger.error('Failed to create project role', error, 'ProjectRoles');
    return apiError('Failed to create role', 'ROLE_CREATE_FAILED', 500);
  }
}
