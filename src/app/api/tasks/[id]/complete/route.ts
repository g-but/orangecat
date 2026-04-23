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

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiNotFound,
  apiValidationError,
  apiBadRequest,
  apiInternalError,
  apiSuccess,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskCompletionSchema } from '@/lib/schemas/tasks';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: taskId } = await context.params;
  const idValidation = getValidationError(validateUUID(taskId, 'task ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    const body = await request.json().catch(() => ({}));
    const result = taskCompletionSchema.safeParse(body);
    if (!result.success) {return apiValidationError('Validation failed', result.error.flatten());}

    const completionData = result.data;

    const { data: task, error: taskError } = await db
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, task_type, is_completed, created_by')
      .eq('id', taskId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {return apiNotFound('Task not found');}
      logger.error('Failed to fetch task for completion', { error: taskError, taskId }, 'TasksAPI');
      return apiInternalError();
    }

    if (task.is_completed && task.task_type === 'one_time') {
      return apiBadRequest('This task has already been completed');
    }

    // The database trigger handles: recurring task reset, one-time completion,
    // attention flag resolution, and pending request completion.
    const { data: completion, error: completionError } = await db
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .insert({
        task_id: taskId,
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        notes: completionData.notes || null,
        duration_minutes: completionData.duration_minutes || null,
      })
      .select('id, completed_by, completed_at, notes, duration_minutes')
      .single();

    if (completionError) {
      logger.error('Failed to create task completion', { error: completionError, taskId }, 'TasksAPI');
      return apiInternalError('Failed to complete task');
    }

    if (task.created_by !== user.id) {
      const { data: profile } = await db
        .from(DATABASE_TABLES.PROFILES)
        .select('username, display_name')
        .eq('id', user.id)
        .single();
      const completerName = profile?.display_name || profile?.username || 'Someone';
      await new NotificationService(db).createNotification({
        recipientUserId: task.created_by,
        type: 'task_completed',
        title: `${completerName} completed "${task.title}"`,
        message: completionData.notes || null,
        actionUrl: `/dashboard/tasks/${taskId}`,
        sourceEntityType: 'task',
        sourceEntityId: taskId,
      });
    }

    return apiSuccess({ completion }, { status: 201 });
  } catch (err) {
    logger.error('Exception in POST /api/tasks/[id]/complete', { error: err }, 'TasksAPI');
    return apiInternalError();
  }
});
