/**
 * Single Task API Routes
 *
 * GET    /api/tasks/[id] - Get a task with its history
 * PATCH  /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Archive a task (soft delete)
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  apiSuccess,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskUpdateSchema } from '@/lib/schemas/tasks';
import { logger } from '@/utils/logger';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { buildTaskUpdates, updateTask, archiveTask } from '@/domain/tasks/taskService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/tasks/[id] — Get a single task with completion history and relations. */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'task ID'));
    if (idValidation) {return idValidation;}

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {return apiUnauthorized('Authentication required');}

    const { data: task, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select(`
        *,
        project:task_projects(id, title, status),
        completions:task_completions(id, completed_by, completed_at, notes, duration_minutes),
        attention_flags:task_attention_flags(id, flagged_by, message, is_resolved, created_at),
        requests:task_requests(id, requested_by, requested_user_id, message, status, is_broadcast, response_message, created_at)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {return apiNotFound('Task not found');}
      logger.error('Failed to fetch task', { error, id }, 'TasksAPI');
      return apiInternalError('Failed to fetch task');
    }

    return apiSuccess({ task });
  } catch (err) {
    logger.error('Exception in GET /api/tasks/[id]', { error: err }, 'TasksAPI');
    return apiInternalError();
  }
}

/** PATCH /api/tasks/[id] — Update a task's fields. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'task ID'));
    if (idValidation) {return idValidation;}

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {return apiUnauthorized('Authentication required');}

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many task update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const result = taskUpdateSchema.safeParse(body);
    if (!result.success) {return apiValidationError('Validation failed', result.error.flatten());}

    const updates = buildTaskUpdates(result.data);
    return await updateTask(supabase, id, updates);
  } catch (err) {
    logger.error('Exception in PATCH /api/tasks/[id]', { error: err }, 'TasksAPI');
    return apiInternalError();
  }
}

/** DELETE /api/tasks/[id] — Archive a task (soft delete). */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idValidation = getValidationError(validateUUID(id, 'task ID'));
    if (idValidation) {return idValidation;}

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {return apiUnauthorized('Authentication required');}

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    return await archiveTask(supabase, id, user.id);
  } catch (err) {
    logger.error('Exception in DELETE /api/tasks/[id]', { error: err }, 'TasksAPI');
    return apiInternalError();
  }
}
