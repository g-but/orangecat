import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';

// Valid status values
const VALID_STATUSES = ['draft', 'active', 'paused', 'completed', 'cancelled'] as const;
type ProjectStatus = (typeof VALID_STATUSES)[number];

// Valid status transitions
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['active'], // Can only publish from draft
  active: ['paused', 'completed', 'cancelled', 'draft'], // Can pause, complete, cancel, or unpublish
  paused: ['active', 'draft'], // Can resume or unpublish
  completed: ['draft'], // Can only unpublish (archive)
  cancelled: ['draft'], // Can only unpublish (archive)
};

// PATCH /api/projects/[id]/status - Update project status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || typeof status !== 'string') {
      return apiValidationError('Status is required');
    }

    const normalizedStatus = status.toLowerCase() as ProjectStatus;
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return apiValidationError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Fetch current project
    const { data: existingProject, error: fetchError } = await supabase
      .from(getTableName('project'))
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
    const { data: project, error: updateError } = await supabase
      .from(getTableName('project'))
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
}
