/**
 * Single Task API Routes
 *
 * GET /api/tasks/[id] - Get a task with its history
 * PATCH /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Archive a task (soft delete)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse, HttpStatus } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskUpdateSchema } from '@/lib/schemas/tasks';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Type for ownership check
interface TaskOwnership {
  created_by: string;
}

/**
 * GET /api/tasks/[id]
 *
 * Get a single task with completion history, attention flags, and requests
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Fetch task with relations
    // Note: Profile joins removed - user IDs reference auth.users, not profiles directly
    const { data: task, error } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select(
        `
        *,
        project:task_projects(id, title, status),
        completions:task_completions(
          id,
          completed_by,
          completed_at,
          notes,
          duration_minutes
        ),
        attention_flags:task_attention_flags(
          id,
          flagged_by,
          message,
          is_resolved,
          created_at
        ),
        requests:task_requests(
          id,
          requested_by,
          requested_user_id,
          message,
          status,
          is_broadcast,
          response_message,
          created_at
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ApiResponses.notFound('Aufgabe');
      }
      logger.error('Failed to fetch task', { error, id }, 'TasksAPI');
      return ApiResponses.internalServerError('Failed to fetch task');
    }

    return createSuccessResponse({ task });
  } catch (err) {
    logger.error('Exception in GET /api/tasks/[id]', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}

/**
 * PATCH /api/tasks/[id]
 *
 * Update a task
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Parse and validate body
    const body = await request.json();
    const result = taskUpdateSchema.safeParse(body);

    if (!result.success) {
      return ApiResponses.validationError('Validation failed', result.error.flatten());
    }

    const updateData = result.data;

    // Build update object (only include fields that were provided)
    const updates: Record<string, unknown> = {};

    if (updateData.title !== undefined) {
      updates.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      updates.description = updateData.description || null;
    }
    if (updateData.instructions !== undefined) {
      updates.instructions = updateData.instructions || null;
    }
    if (updateData.task_type !== undefined) {
      updates.task_type = updateData.task_type;
    }
    if (updateData.schedule_cron !== undefined) {
      updates.schedule_cron = updateData.schedule_cron || null;
    }
    if (updateData.schedule_human !== undefined) {
      updates.schedule_human = updateData.schedule_human || null;
    }
    if (updateData.category !== undefined) {
      updates.category = updateData.category;
    }
    if (updateData.tags !== undefined) {
      updates.tags = updateData.tags;
    }
    if (updateData.priority !== undefined) {
      updates.priority = updateData.priority;
    }
    if (updateData.estimated_minutes !== undefined) {
      updates.estimated_minutes = updateData.estimated_minutes || null;
    }
    if (updateData.project_id !== undefined) {
      updates.project_id = updateData.project_id || null;
    }
    if (updateData.current_status !== undefined) {
      updates.current_status = updateData.current_status;
    }
    if (updateData.is_archived !== undefined) {
      updates.is_archived = updateData.is_archived;
    }

    // Update task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: task, error } = await (supabase as any)
      .from(DATABASE_TABLES.TASKS)
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        project:task_projects(id, title, status)
      `
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ApiResponses.notFound('Aufgabe');
      }
      logger.error('Failed to update task', { error, id }, 'TasksAPI');
      return ApiResponses.internalServerError('Failed to update task');
    }

    return createSuccessResponse({ task }, HttpStatus.OK, 'Aufgabe aktualisiert');
  } catch (err) {
    logger.error('Exception in PATCH /api/tasks/[id]', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}

/**
 * DELETE /api/tasks/[id]
 *
 * Archive a task (soft delete)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Check if user is the creator
    const { data: existingTaskData, error: fetchError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return ApiResponses.notFound('Aufgabe');
      }
      logger.error('Failed to fetch task for deletion', { error: fetchError, id }, 'TasksAPI');
      return ApiResponses.internalServerError();
    }

    const existingTask = existingTaskData as unknown as TaskOwnership;

    if (existingTask.created_by !== user.id) {
      return ApiResponses.authorizationFailed('Nur der Ersteller kann diese Aufgabe archivieren');
    }

    // Soft delete (archive)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from(DATABASE_TABLES.TASKS)
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      logger.error('Failed to archive task', { error, id }, 'TasksAPI');
      return ApiResponses.internalServerError('Failed to archive task');
    }

    return createSuccessResponse(null, HttpStatus.OK, 'Aufgabe archiviert');
  } catch (err) {
    logger.error('Exception in DELETE /api/tasks/[id]', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}
