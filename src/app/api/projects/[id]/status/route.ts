/**
 * Project Status API
 *
 * PATCH /api/projects/[id]/status - Update project status
 *
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextResponse } from 'next/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { rateLimit, createRateLimitResponse, applyRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { VALID_PROJECT_STATUSES, type ProjectStatus } from '@/config/project-statuses';

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
    // Rate limiting check
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.success) {
      const rateLimited = createRateLimitResponse(rateLimitResult);
      return NextResponse.json(await rateLimited.json(), {
        status: rateLimited.status,
        headers: rateLimited.headers,
      });
    }

    const { user, supabase } = request;

    const { id } = await context.params;
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

    return applyRateLimitHeaders(
      apiSuccess({
        ...project,
        status: normalizedStatus,
      }),
      rateLimitResult
    );
  } catch (error) {
    return handleApiError(error);
  }
});
