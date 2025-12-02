import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiNotFound, apiInternalError } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';

/**
 * Toggle favorite status for a project
 * POST /api/projects/[id]/favorite - Add to favorites
 * DELETE /api/projects/[id]/favorite - Remove from favorites
 */
async function handleToggleFavorite(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Validate project ID
    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    const user = request.user;

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, title')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      logger.error('Project not found for favorite', { projectId, userId: user.id });
      return apiNotFound('Project not found');
    }

    // Check if already favorited
    const { data: existingFavorite, error: favoriteCheckError } = await supabase
      .from('project_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .maybeSingle();

    if (favoriteCheckError) {
      logger.error('Failed to check favorite status', {
        userId: user.id,
        projectId,
        error: favoriteCheckError.message,
      });
      return apiInternalError('Failed to check favorite status');
    }

    if (request.method === 'POST') {
      // Add to favorites
      if (existingFavorite) {
        return apiSuccess({
          isFavorited: true,
          message: 'Project already in favorites',
        });
      }

      const { error: insertError } = await supabase.from('project_favorites').insert({
        user_id: user.id,
        project_id: projectId,
      });

      if (insertError) {
        logger.error('Failed to add favorite', {
          userId: user.id,
          projectId,
          error: insertError.message,
        });
        return apiInternalError('Failed to add favorite');
      }

      // Audit log favorite added
      await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', projectId, {
        action: 'favorite',
        projectTitle: project.title,
      });

      logger.info('Project added to favorites', { userId: user.id, projectId });
      return apiSuccess({
        isFavorited: true,
        message: 'Project added to favorites',
      });
    } else if (request.method === 'DELETE') {
      // Remove from favorites
      if (!existingFavorite) {
        return apiSuccess({
          isFavorited: false,
          message: 'Project not in favorites',
        });
      }

      const { error: deleteError } = await supabase
        .from('project_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

      if (deleteError) {
        logger.error('Failed to remove favorite', {
          userId: user.id,
          projectId,
          error: deleteError.message,
        });
        return apiInternalError('Failed to remove favorite');
      }

      // Audit log favorite removed
      await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', projectId, {
        action: 'unfavorite',
        projectTitle: project.title,
      });

      logger.info('Project removed from favorites', { userId: user.id, projectId });
      return apiSuccess({
        isFavorited: false,
        message: 'Project removed from favorites',
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    logger.error('Unexpected error in favorite toggle', { error });
    return apiInternalError('Internal server error');
  }
}

/**
 * Check if a project is favorited by the current user
 * GET /api/projects/[id]/favorite
 */
async function handleGetFavoriteStatus(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Validate project ID
    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    const user = request.user;

    const { data: favorite, error: favoriteError } = await supabase
      .from('project_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .maybeSingle();

    if (favoriteError) {
      logger.error('Failed to check favorite status', {
        userId: user.id,
        projectId,
        error: favoriteError.message,
      });
      return apiInternalError('Failed to check favorite status');
    }

    return apiSuccess({ isFavorited: !!favorite });
  } catch (error) {
    logger.error('Unexpected error checking favorite status', { error });
    return apiInternalError('Internal server error');
  }
}

export const POST = withAuth(handleToggleFavorite);
export const DELETE = withAuth(handleToggleFavorite);
export const GET = withAuth(handleGetFavoriteStatus);
