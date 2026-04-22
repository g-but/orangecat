/**
 * Project Media API
 *
 * GET    /api/projects/[id]/media - List media for a project (with public URLs)
 * POST   /api/projects/[id]/media - Save media metadata after upload
 * DELETE /api/projects/[id]/media?mediaId=... - Delete a media item
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
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createServerClient } from '@/lib/supabase/server';
import { saveProjectMedia } from '@/domain/projects/mediaService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET - No auth required, media is public */
export async function GET(_request: Request, context: RouteContext) {
  const { id: projectId } = await context.params;
  const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
  if (idValidation) {return idValidation;}
  try {
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

/** DELETE - Requires auth and project ownership */
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: projectId } = await context.params;
  const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));
    }

    const mediaId = new URL(request.url).searchParams.get('mediaId');
    if (!mediaId) {return apiBadRequest('mediaId query parameter is required');}
    const mediaIdValidation = getValidationError(validateUUID(mediaId, 'media ID'));
    if (mediaIdValidation) {return mediaIdValidation;}

    const { data: project } = await supabase.from(getTableName('project')).select('user_id').eq('id', projectId).single();
    if (!project) {return apiNotFound('Project not found');}
    if (user.id !== project.user_id) {return apiForbidden('You can only delete media from your own projects');}

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

/** POST - Save media metadata after client-side upload */
export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: projectId } = await context.params;
  const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));
    }

    const { path, alt_text } = await request.json();
    if (!path || typeof path !== 'string' || !path.startsWith(`${projectId}/`)) {
      return apiBadRequest('Invalid storage path');
    }

    const result = await saveProjectMedia(supabase, projectId, user.id, path, alt_text);
    if (!result.ok) {
      switch (result.code) {
        case 'NOT_FOUND': return apiNotFound(result.message);
        case 'FORBIDDEN': return apiForbidden(result.message);
        case 'COUNT_EXCEEDED': return apiBadRequest(result.message);
        case 'DB_ERROR': return apiInternalError(result.message);
      }
    }

    logger.info('Media uploaded successfully', { projectId, userId: user.id, mediaId: result.media.id });
    return apiSuccess({ media: result.media });
  } catch (error) {
    logger.error('Unexpected error uploading media', { error });
    return apiInternalError('Failed to create media');
  }
});
