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
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';

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

    const { data: project } = await supabase
      .from(getTableName('project'))
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      logger.error('Project not found for upload URL', { projectId, userId: user.id });
      return apiNotFound('Project not found');
    }

    if (user.id !== project.user_id) {
      logger.warn('Unauthorized upload URL request', {
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

    // Allow upload if count is less than 3 (0, 1, or 2 images)
    if (count !== null && count >= 3) {
      logger.info('Maximum media limit reached for upload URL', {
        projectId,
        userId: user.id,
        count,
      });
      return apiBadRequest('Maximum 3 images per project');
    }

    const { fileName } = await request.json();
    const ext = (fileName?.split('.').pop() || 'jpg').toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowed.includes(ext)) {
      logger.info('Invalid file type for upload', { projectId, userId: user.id, ext });
      return apiBadRequest(`Invalid file type. Allowed: ${allowed.join(', ')}`);
    }

    const filePath = `${projectId}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('project-media')
      .createSignedUploadUrl(filePath);

    if (error) {
      logger.error('Failed to create signed upload URL', {
        projectId,
        userId: user.id,
        error: error.message,
      });
      return apiInternalError('Failed to generate upload URL');
    }

    logger.info('Upload URL generated successfully', {
      projectId,
      userId: user.id,
      filePath,
      ext,
    });

    return apiSuccess({
      upload_url: data.signedUrl,
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    logger.error('Unexpected error generating upload URL', { error });
    return apiInternalError('Failed to generate upload URL');
  }
}
