import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiInternalError,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    // Validate project ID
    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    const { path, alt_text } = await request.json();

    if (!path || typeof path !== 'string' || !path.startsWith(`${projectId}/`)) {
      return apiBadRequest('Invalid storage path');
    }

    const { data: project } = await supabase
      .from('projects')
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
      .from('project_media')
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
      .from('project_media')
      .select('position')
      .eq('project_id', projectId);

    const existingPositions = (existing || []).map(m => m.position).sort((a, b) => a - b);

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
      .from('project_media')
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
}
