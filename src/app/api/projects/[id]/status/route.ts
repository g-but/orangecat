/**
 * Project Status API
 *
 * PATCH /api/projects/[id]/status - Update project status
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { VALID_PROJECT_STATUSES, type ProjectStatus } from '@/config/project-statuses';
import { validateUUID, getValidationError } from '@/lib/api/validation';

// Valid status transitions
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['active'], // Can only publish from draft
  active: ['paused', 'completed', 'cancelled', 'draft'], // Can pause, complete, cancel, or unpublish
  paused: ['active', 'draft'], // Can resume or unpublish
  completed: ['draft'], // Can only unpublish (archive)
  cancelled: ['draft'], // Can only unpublish (archive)
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/projects/[id]/status - Update project status
export const PATCH = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { user, supabase } = request;

    // Rate limiting check (user-based)
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = retryAfterSeconds(rl);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'project ID'));
    if (idValidation) {return idValidation;}
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || typeof status !== 'string') {
      return apiValidationError('Status is required');
    }

    const normalizedStatus = status.toLowerCase() as ProjectStatus;
    if (!VALID_PROJECT_STATUSES.includes(normalizedStatus)) {
      return apiValidationError(
        `Invalid status. Must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`
      );
    }

    // Fetch current project
    const { data: existingProject, error: fetchError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(getTableName('project')) as any
    )
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return apiNotFound('Project not found');
    }

    // Check ownership
    if (existingProject.user_id !== user.id) {
      return apiUnauthorized('You can only update your own projects');
    }

    // Check if transition is valid
    const currentStatus = existingProject.status?.toLowerCase() as ProjectStatus;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(normalizedStatus)) {
      return apiValidationError(
        `Cannot transition from '${currentStatus}' to '${normalizedStatus}'. ` +
          `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }

    // Update status
    const { data: project, error: updateError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(getTableName('project')) as any
    )
      .update({
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return handleSupabaseError(updateError);
    }

    logger.info(`Project ${id} status changed from ${currentStatus} to ${normalizedStatus}`, {
      userId: user.id,
      projectId: id,
      oldStatus: currentStatus,
      newStatus: normalizedStatus,
    });

    return apiSuccess({
      ...project,
      status: normalizedStatus,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
