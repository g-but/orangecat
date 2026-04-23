/**
 * Project Favorites API
 *
 * GET    /api/projects/[id]/favorite - Check if favorited
 * POST   /api/projects/[id]/favorite - Add to favorites
 * DELETE /api/projects/[id]/favorite - Remove from favorites
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiInternalError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
interface RouteContext { params: Promise<{ id: string }> }

export const GET = withAuth(async (request: AuthenticatedRequest, { params }: RouteContext) => {
  const { id: projectId } = await params;
  const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
  if (idValidation) {return idValidation;}
  try {
    const { supabase } = request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: favorite, error } = await (supabase.from(DATABASE_TABLES.PROJECT_FAVORITES) as any)
      .select('id').eq('user_id', request.user.id).eq('project_id', projectId).maybeSingle();
    if (error) {return apiInternalError('Failed to check favorite status');}
    return apiSuccess({ isFavorited: !!favorite });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest, { params }: RouteContext) => {
  const { id: projectId } = await params;
  const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project } = await (supabase.from(getTableName('project')) as any)
      .select('id, title').eq('id', projectId).single();
    if (!project) {return apiNotFound('Project not found');}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from(DATABASE_TABLES.PROJECT_FAVORITES) as any)
      .select('id').eq('user_id', user.id).eq('project_id', projectId).maybeSingle();
    if (existing) {return apiSuccess({ isFavorited: true, message: 'Project already in favorites' });}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(DATABASE_TABLES.PROJECT_FAVORITES) as any)
      .insert({ user_id: user.id, project_id: projectId });
    if (error) {return apiInternalError('Failed to add favorite');}

    await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', projectId, { action: 'favorite', projectTitle: project.title });
    logger.info('Project added to favorites', { userId: user.id, projectId });
    return apiSuccess({ isFavorited: true, message: 'Project added to favorites' });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }: RouteContext) => {
  const { id: projectId } = await params;
  const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project } = await (supabase.from(getTableName('project')) as any)
      .select('id, title').eq('id', projectId).single();
    if (!project) {return apiNotFound('Project not found');}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from(DATABASE_TABLES.PROJECT_FAVORITES) as any)
      .select('id').eq('user_id', user.id).eq('project_id', projectId).maybeSingle();
    if (!existing) {return apiSuccess({ isFavorited: false, message: 'Project not in favorites' });}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(DATABASE_TABLES.PROJECT_FAVORITES) as any)
      .delete().eq('user_id', user.id).eq('project_id', projectId);
    if (error) {return apiInternalError('Failed to remove favorite');}

    await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', projectId, { action: 'unfavorite', projectTitle: project.title });
    logger.info('Project removed from favorites', { userId: user.id, projectId });
    return apiSuccess({ isFavorited: false, message: 'Project removed from favorites' });
  } catch (error) {
    return handleApiError(error);
  }
});
