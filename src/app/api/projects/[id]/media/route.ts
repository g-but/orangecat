/**
 * Project Media API
 *
 * GET    /api/projects/[id]/media - List media for a project (with public URLs)
 * POST   /api/projects/[id]/media - Save media metadata after upload
 * DELETE /api/projects/[id]/media?mediaId=... - Delete a media item
 *
 * Last Modified: 2026-02-20
 * Last Modified Summary: Added GET and DELETE handlers; moved DB ops out of component
 */

import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/media
 * Returns media items with public storage URLs for a project.
 * No auth required — media is public.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;

    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from(DATABASE_TABLES.PROJECT_MEDIA)
      .select('id, storage_path, position, alt_text')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (error) {
      logger.error('Failed to load project media', { projectId, error: error.message });
      return apiInternalError('Failed to load media');
    }

    const media = (data || []).map((m: { storage_path: string; id: string; position: number; alt_text?: string }) => {
      const { data: urlData } = supabase.storage.from('project-media').getPublicUrl(m.storage_path);
      return { ...m, url: urlData.publicUrl };
    });

    return apiSuccess({ media });
  } catch (error) {
    logger.error('Unexpected error loading media', { error });
    return apiInternalError('Failed to load media');
  }
}

/**
 * DELETE /api/projects/[id]/media?mediaId=<uuid>
 * Deletes a media item. Requires auth and project ownership.
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: projectId } = await context.params;

    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const { user: _rlUser } = request;
    const rl = await rateLimitWriteAsync(_rlUser.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const url = new URL(request.url);
    const mediaId = url.searchParams.get('mediaId');
    if (!mediaId) {
      return apiBadRequest('mediaId query parameter is required');
    }

    const mediaIdValidation = getValidationError(validateUUID(mediaId, 'media ID'));
    if (mediaIdValidation) {
      return mediaIdValidation;
    }

    const { user, supabase } = request;

    // Verify project ownership
    const { data: project } = await supabase
      .from(getTableName('project'))
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return apiNotFound('Project not found');
    }
    if (user.id !== project.user_id) {
      return apiForbidden('You can only delete media from your own projects');
    }

    const { error } = await supabase
      .from(DATABASE_TABLES.PROJECT_MEDIA)
      .delete()
      .eq('id', mediaId)
      .eq('project_id', projectId);

    if (error) {
      logger.error('Failed to delete media', { projectId, mediaId, error: error.message });
      return apiInternalError('Failed to delete media');
    }

    logger.info('Media deleted', { projectId, mediaId, userId: user.id });
    return apiSuccess({ deleted: true });
  } catch (error) {
    logger.error('Unexpected error deleting media', { error });
    return apiInternalError('Failed to delete media');
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: projectId } = await context.params;

    // Validate project ID
    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const { path, alt_text } = await request.json();

    if (!path || typeof path !== 'string' || !path.startsWith(`${projectId}/`)) {
      return apiBadRequest('Invalid storage path');
    }

    const { data: project } = await supabase
      .from(getTableName('project'))
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      logger.error('Project not found for media upload', { projectId, userId: user.id });
      return apiNotFound('Project not found');
    }

    if (user.id !== project.user_id) {
      logger.warn('Unauthorized media upload attempt', {
        projectId,
        userId: user.id,
        ownerId: project.user_id,
      });
      return apiForbidden('You can only upload media to your own projects');
    }

    // Check current media count - use fresh query to avoid stale data
    const { count, error: countError } = await supabase
      .from(DATABASE_TABLES.PROJECT_MEDIA)
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (countError) {
      logger.error('Failed to check media count', {
        projectId,
        userId: user.id,
        error: countError.message,
      });
      return apiInternalError('Failed to check media count');
    }

    // Allow insert if count is less than 3 (0, 1, or 2 images)
    if (count !== null && count >= 3) {
      logger.info('Maximum media limit reached', { projectId, userId: user.id, count });
      return apiBadRequest('Maximum 3 images per project');
    }

    // Find the first available position (0, 1, or 2)
    // Get all existing positions
    const { data: existing } = await supabase
      .from(DATABASE_TABLES.PROJECT_MEDIA)
      .select('position')
      .eq('project_id', projectId);

    const existingPositions = (existing || [])
      .map((m: { position: number }) => m.position)
      .sort((a, b) => a - b);

    // Find first available position (0, 1, or 2)
    let nextPosition = 0;
    for (let i = 0; i < 3; i++) {
      if (!existingPositions.includes(i)) {
        nextPosition = i;
        break;
      }
    }

    // Safety check: if somehow all positions are taken (shouldn't happen due to count check)
    if (nextPosition > 2) {
      return apiBadRequest('Maximum 3 images per project');
    }

    const { data: media, error } = await supabase
      .from(DATABASE_TABLES.PROJECT_MEDIA)
      .insert({ project_id: projectId, storage_path: path, position: nextPosition, alt_text })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create media record', {
        projectId,
        userId: user.id,
        error: error.message,
      });
      return apiInternalError('Failed to create media record');
    }

    // Audit log media upload
    await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', projectId, {
      action: 'media_upload',
      mediaId: media.id,
      position: nextPosition,
      path,
    });

    logger.info('Media uploaded successfully', {
      projectId,
      userId: user.id,
      mediaId: media.id,
      position: nextPosition,
    });

    return apiSuccess({ media });
  } catch (error) {
    logger.error('Unexpected error uploading media', { error });
    return apiInternalError('Failed to create media');
  }
});
