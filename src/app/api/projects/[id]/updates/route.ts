/**
 * Project Updates API Endpoint
 *
 * GET /api/projects/[id]/updates - Fetch recent project activity
 *
 * Created: 2025-11-17
 * Last Modified: 2026-08-24
 * Last Modified Summary: Read timeline_events (where activity actually lands,
 * including the external publish bus) instead of the never-written
 * project_updates table; let a project's owner see their own draft's activity.
 */

import { withOptionalAuth } from '@/lib/api/withAuth';
import { apiSuccess, apiNotFound, handleApiError } from '@/lib/api/standardResponse';
import { getTableName } from '@/config/entity-registry';
import { isProjectPubliclyVisible } from '@/config/project-statuses';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { listProjectActivity } from '@/services/projects/activity';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]/updates
 *
 * Public endpoint — anonymous callers see public activity on published
 * projects. The owner additionally sees their own project's activity while it
 * is still a draft, so an unpublished project does not read as idle to the one
 * person who can act on it.
 */
export const GET = withOptionalAuth(async (req, { params }: RouteParams) => {
  try {
    const { id: projectId } = await params;
    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const { supabase, user } = req;

    const { data: project, error: projectError } = await supabase
      .from(getTableName('project'))
      .select('id, status, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      logger.warn('Project not found for updates', { projectId }, 'ProjectUpdatesAPI');
      return apiNotFound('Project not found');
    }

    const { status, user_id: ownerId } = project as { status: string; user_id: string | null };
    const isOwner = !!user && !!ownerId && user.id === ownerId;

    if (!isProjectPubliclyVisible(status) && !isOwner) {
      return apiSuccess({ updates: [], count: 0 });
    }

    const result = await listProjectActivity(supabase, projectId, { includeNonPublic: isOwner });
    if (!result.success) {
      return handleApiError(new Error(result.error));
    }

    const updates = result.data ?? [];
    return apiSuccess({ updates, count: updates.length });
  } catch (error) {
    return handleApiError(error);
  }
});
