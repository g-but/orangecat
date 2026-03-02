/**
 * Project Support Detail API Route
 *
 * Handles individual project support operations (delete).
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiForbidden, apiInternalError, apiSuccess } from '@/lib/api/standardResponse';
import projectSupportService from '@/services/projects/support';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string; supportId: string }>;
}

// DELETE /api/projects/[id]/support/[supportId] - Delete project support
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { supportId } = await context.params;

    // Delete support
    const result = await projectSupportService.deleteProjectSupport(supportId);

    if (!result.success) {
      const msg = result.error || 'Failed to delete support';
      if (result.error === 'Unauthorized' || result.error === 'Forbidden') {
        return apiForbidden(msg);
      }
      return apiInternalError(msg);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/projects/[id]/support/[supportId]:', error);
    return apiInternalError();
  }
});
