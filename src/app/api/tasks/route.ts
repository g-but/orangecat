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
import {
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  apiRateLimited,
  apiSuccess,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskSchema, type TaskFilter } from '@/lib/schemas/tasks';
import { TASK_DEFAULTS } from '@/config/tasks';
import { logger } from '@/utils/logger';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

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
      return apiUnauthorized('Authentication required');
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

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

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
      return apiInternalError('Failed to fetch tasks');
    }

    return apiSuccess(
      { tasks },
      {
        total: count || 0,
        limit,
      }
    );
  } catch (err) {
    logger.error('Exception in GET /api/tasks', { error: err }, 'TasksAPI');
    return apiInternalError();
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
      return apiUnauthorized('Authentication required');
    }

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many task creation requests. Please slow down.', retryAfter);
    }

    // Parse and validate body
    const body = await request.json();
    const result = taskSchema.safeParse(body);

    if (!result.success) {
      return apiValidationError('Validation failed', result.error.flatten());
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
      return apiInternalError('Failed to create task');
    }

    return apiSuccess({ task }, { status: 201 });
  } catch (err) {
    logger.error('Exception in POST /api/tasks', { error: err }, 'TasksAPI');
    return apiInternalError();
  }
}
