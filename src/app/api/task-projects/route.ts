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
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse, HttpStatus } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskProjectSchema } from '@/lib/schemas/tasks';
import { PROJECT_DEFAULTS } from '@/config/tasks';
import { logger } from '@/utils/logger';

/**
 * GET /api/task-projects
 *
 * List task projects
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Parse query params
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
      return ApiResponses.internalServerError('Failed to fetch projects');
    }

    return createSuccessResponse({ projects });
  } catch (err) {
    logger.error('Exception in GET /api/task-projects', { error: err }, 'TaskProjectsAPI');
    return ApiResponses.internalServerError();
  }
}

/**
 * POST /api/task-projects
 *
 * Create a new task project
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Parse and validate body
    const body = await request.json();
    const result = taskProjectSchema.safeParse(body);

    if (!result.success) {
      return ApiResponses.validationError('Validation failed', result.error.flatten());
    }

    const projectData = result.data;

    // Create project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
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
      return ApiResponses.internalServerError('Failed to create project');
    }

    return createSuccessResponse({ project }, HttpStatus.CREATED, 'Project created');
  } catch (err) {
    logger.error('Exception in POST /api/task-projects', { error: err }, 'TaskProjectsAPI');
    return ApiResponses.internalServerError();
  }
}
