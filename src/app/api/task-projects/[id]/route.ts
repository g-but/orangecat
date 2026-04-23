/**
 * Single Task Project API
 *
 * GET    /api/task-projects/[id] - Get a project with its tasks
 * PATCH  /api/task-projects/[id] - Update a project
 * DELETE /api/task-projects/[id] - Delete a project
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  apiSuccess,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskProjectUpdateSchema } from '@/lib/schemas/tasks';
import { logger } from '@/utils/logger';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { verifyTaskProjectOwner, buildTaskProjectUpdates } from '@/domain/tasks/taskProjectService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'project ID'));
  if (idValidation) {return idValidation;}
  const { supabase } = request;
  try {
    const { data: project, error } = await supabase
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .select(`*, tasks:tasks(id, title, category, priority, current_status, task_type, is_completed)`)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {return apiNotFound('Project not found');}
      logger.error('Failed to fetch task project', { error, id }, 'TaskProjectsAPI');
      return apiInternalError('Failed to fetch project');
    }

    return apiSuccess({ project });
  } catch (err) {
    logger.error('Exception in GET /api/task-projects/[id]', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
});

export const PATCH = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'project ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    const ownership = await verifyTaskProjectOwner(supabase, id, user.id);
    if (ownership === 'not_found') {return apiNotFound('Project not found');}
    if (ownership === 'forbidden') {return apiForbidden('Only the creator can edit this project');}

    const body = await (request as NextRequest).json();
    const result = taskProjectUpdateSchema.safeParse(body);
    if (!result.success) {return apiValidationError('Validation failed', result.error.flatten());}

    const updates = buildTaskProjectUpdates(result.data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to update task project', { error, id }, 'TaskProjectsAPI');
      return apiInternalError('Failed to update project');
    }

    return apiSuccess({ project });
  } catch (err) {
    logger.error('Exception in PATCH /api/task-projects/[id]', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'project ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    const ownership = await verifyTaskProjectOwner(supabase, id, user.id);
    if (ownership === 'not_found') {return apiNotFound('Project not found');}
    if (ownership === 'forbidden') {return apiForbidden('Only the creator can delete this project');}

    const { error } = await supabase.from(DATABASE_TABLES.TASK_PROJECTS).delete().eq('id', id);
    if (error) {
      logger.error('Failed to delete task project', { error, id }, 'TaskProjectsAPI');
      return apiInternalError('Failed to delete project');
    }

    return apiSuccess(null);
  } catch (err) {
    logger.error('Exception in DELETE /api/task-projects/[id]', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
});
