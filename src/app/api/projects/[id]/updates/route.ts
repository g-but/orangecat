/**
 * Project Updates API Endpoint
 *
 * GET /api/projects/[id]/updates - Fetch recent project updates
 *
 * Created: 2025-11-17
 */

import { withOptionalAuth } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]/updates
 *
 * Fetches recent updates for a project (updates, donations, milestones)
 * Public endpoint - no authentication required for viewing
 */
export const GET = withOptionalAuth(async (req, { params }: RouteParams) => {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return apiValidationError('Project ID is required');
    }

    const supabase = await createServerClient();

    // Fetch project to ensure it exists and is viewable
    const { data: project, error: projectError } = await (supabase
      .from(getTableName('project')) as any)
      .select('id, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      logger.warn('Project not found for updates', { projectId }, 'ProjectUpdatesAPI');
      return apiNotFound('Project not found');
    }

    // Only show updates for active or completed projects (privacy)
    if (!['active', 'completed'].includes(project.status)) {
      return apiSuccess({ updates: [], count: 0 });
    }

    // Fetch recent updates (limit to 10 most recent)
    const { data: updates, error: updatesError } = await (supabase
      .from('project_updates') as any)
      .select('id, project_id, type, title, content, amount_btc, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (updatesError) {
      logger.error(
        'Failed to fetch project updates',
        { projectId, error: updatesError },
        'ProjectUpdatesAPI'
      );
      return handleApiError(updatesError);
    }

    return apiSuccess({
      updates: updates || [],
      count: updates?.length || 0,
    });
  } catch (error) {
    logger.error('Unexpected error in project updates API', { error, projectId: (await params).id }, 'ProjectUpdatesAPI');
    return handleApiError(error);
  }
});
