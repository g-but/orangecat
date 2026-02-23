/**
 * Task Completion API
 *
 * POST /api/tasks/[id]/complete - Mark a task as completed
 *
 * Self-reporting model: Anyone can complete a task.
 * The completion trigger handles status reset and request resolution.
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse, HttpStatus } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskCompletionSchema } from '@/lib/schemas/tasks';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Types for query results
interface TaskRow {
  id: string;
  title: string;
  task_type: string;
  is_completed: boolean;
  created_by: string;
}

interface ProfileRow {
  username: string | null;
  display_name: string | null;
}

/**
 * POST /api/tasks/[id]/complete
 *
 * Record a task completion
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: taskId } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Parse and validate body
    const body = await request.json().catch(() => ({}));
    const result = taskCompletionSchema.safeParse(body);

    if (!result.success) {
      return ApiResponses.validationError('Validation failed', result.error.flatten());
    }

    const completionData = result.data;

    // Verify task exists and is not already completed (for one-time tasks)
    const { data: taskData, error: taskError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, task_type, is_completed, created_by')
      .eq('id', taskId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return ApiResponses.notFound('Task');
      }
      logger.error('Failed to fetch task for completion', { error: taskError, taskId }, 'TasksAPI');
      return ApiResponses.internalServerError();
    }

    const task = taskData as unknown as TaskRow;

    if (task.is_completed && task.task_type === 'one_time') {
      return ApiResponses.badRequest('This task has already been completed');
    }

    // Create completion record
    // The database trigger will handle:
    // - Resetting recurring task status to 'idle'
    // - Marking one-time tasks as completed
    // - Resolving attention flags
    // - Completing pending requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: completion, error: completionError } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .insert({
        task_id: taskId,
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        notes: completionData.notes || null,
        duration_minutes: completionData.duration_minutes || null,
      })
      .select(
        `
        id,
        completed_by,
        completed_at,
        notes,
        duration_minutes
      `
      )
      .single();

    if (completionError) {
      logger.error(
        'Failed to create task completion',
        { error: completionError, taskId },
        'TasksAPI'
      );
      return ApiResponses.internalServerError('Failed to complete task');
    }

    // Notify task creator if they're not the one completing
    if (task.created_by !== user.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notificationService = new NotificationService(supabase as any);

      // Get completer's name
      const { data: profileData } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('username, display_name')
        .eq('id', user.id)
        .single();

      const completerProfile = profileData as ProfileRow | null;
      const completerName =
        completerProfile?.display_name || completerProfile?.username || 'Someone';

      await notificationService.createNotification({
        recipientUserId: task.created_by,
        type: 'task_completed',
        title: `${completerName} completed "${task.title}"`,
        message: completionData.notes || null,
        actionUrl: `/dashboard/tasks/${taskId}`,
        sourceEntityType: 'task',
        sourceEntityId: taskId,
      });
    }

    return createSuccessResponse({ completion }, HttpStatus.CREATED, 'Task marked as completed');
  } catch (err) {
    logger.error('Exception in POST /api/tasks/[id]/complete', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}
