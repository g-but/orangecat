/**
 * Tasks API Routes
 *
 * GET /api/tasks - List tasks with filters
 * POST /api/tasks - Create a new task
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse, HttpStatus } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskSchema, type TaskFilter } from '@/lib/schemas/tasks';
import { TASK_DEFAULTS } from '@/config/tasks';
import { logger } from '@/utils/logger';

/**
 * GET /api/tasks
 *
 * List tasks with optional filters
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
    const filters: TaskFilter = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      task_type: searchParams.get('task_type') || undefined,
      priority: searchParams.get('priority') || undefined,
      project_id: searchParams.get('project_id') || undefined,
      is_archived: searchParams.get('is_archived') === 'true',
      search: searchParams.get('search') || undefined,
    };

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    // Note: Profile joins removed - created_by/completed_by reference auth.users, not profiles directly
    let query = supabase
      .from(DATABASE_TABLES.TASKS)
      .select(
        `
        *,
        project:task_projects(id, title, status)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (!filters.is_archived) {
      query = query.eq('is_archived', false);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.status) {
      query = query.eq('current_status', filters.status);
    }

    if (filters.task_type) {
      query = query.eq('task_type', filters.task_type);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data: tasks, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch tasks', { error }, 'TasksAPI');
      return ApiResponses.internalServerError('Failed to fetch tasks');
    }

    return createSuccessResponse({ tasks }, HttpStatus.OK, undefined, {
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    logger.error('Exception in GET /api/tasks', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}

/**
 * POST /api/tasks
 *
 * Create a new task
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
    const result = taskSchema.safeParse(body);

    if (!result.success) {
      return ApiResponses.validationError('Validation failed', result.error.flatten());
    }

    const taskData = result.data;

    // Create task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error } = await (supabase as any)
      .from(DATABASE_TABLES.TASKS)
      .insert({
        title: taskData.title,
        description: taskData.description || null,
        instructions: taskData.instructions || null,
        task_type: taskData.task_type,
        schedule_cron: taskData.schedule_cron || null,
        schedule_human: taskData.schedule_human || null,
        category: taskData.category,
        tags: taskData.tags || [],
        priority: taskData.priority || TASK_DEFAULTS.priority,
        estimated_minutes: taskData.estimated_minutes || null,
        project_id: taskData.project_id || null,
        current_status: TASK_DEFAULTS.status,
        created_by: user.id,
      })
      .select(
        `
        *,
        project:task_projects(id, title, status)
      `
      )
      .single();

    if (error) {
      logger.error('Failed to create task', { error }, 'TasksAPI');
      return ApiResponses.internalServerError('Failed to create task');
    }

    return createSuccessResponse({ task }, HttpStatus.CREATED, 'Aufgabe erstellt');
  } catch (err) {
    logger.error('Exception in POST /api/tasks', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}
