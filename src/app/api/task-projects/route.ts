/**
 * Task Projects API
 *
 * GET /api/task-projects - List task projects
 * POST /api/task-projects - Create a new project
 *
 * Note: Uses 'task_projects' table to avoid conflict with existing 'projects' table
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiValidationError,
  apiInternalError,
  apiSuccess,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskProjectSchema } from '@/lib/schemas/tasks';
import { PROJECT_DEFAULTS } from '@/config/tasks';
import { logger } from '@/utils/logger';

/**
 * GET /api/task-projects
 *
 * List task projects
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { supabase } = request;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    let query = supabase
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .select(
        `
        *,
        tasks:tasks(count)
      `
      )
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: projects, error } = await query;

    if (error) {
      logger.error('Failed to fetch task projects', { error }, 'TaskProjectsAPI');
      return apiInternalError('Failed to fetch projects');
    }

    return apiSuccess({ projects });
  } catch (err) {
    logger.error('Exception in GET /api/task-projects', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
});

/**
 * POST /api/task-projects
 *
 * Create a new task project
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = retryAfterSeconds(rl);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const body = await (request as NextRequest).json();
    const result = taskProjectSchema.safeParse(body);

    if (!result.success) {
      return apiValidationError('Validation failed', result.error.flatten());
    }

    const projectData = result.data;

    const { data: project, error } = await supabase
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .insert({
        title: projectData.title,
        description: projectData.description || null,
        status: projectData.status || PROJECT_DEFAULTS.status,
        target_date: projectData.target_date || null,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to create task project', { error }, 'TaskProjectsAPI');
      return apiInternalError('Failed to create project');
    }

    return apiSuccess({ project }, { status: 201 });
  } catch (err) {
    logger.error('Exception in POST /api/task-projects', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
});
