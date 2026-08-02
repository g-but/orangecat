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

import {
  apiNotFound,
  apiBadRequest,
  apiInternalError,
  apiSuccess,
} from '@/lib/api/standardResponse';
import { createTaskActionRoute } from '@/lib/api/taskActionRoute';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskCompletionSchema } from '@/lib/schemas/tasks';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';

export const POST = createTaskActionRoute({
  schema: taskCompletionSchema,
  routeName: 'POST /api/tasks/[id]/complete',
  handler: async ({ taskId, user, supabase, data: completionData }) => {
    const { data: task, error: taskError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, task_type, is_completed, created_by')
      .eq('id', taskId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return apiNotFound('Task not found');
      }
      logger.error('Failed to fetch task for completion', { error: taskError, taskId }, 'TasksAPI');
      return apiInternalError();
    }

    if (task.is_completed && task.task_type === 'one_time') {
      return apiBadRequest('This task has already been completed');
    }

    // The database trigger handles: recurring task reset, one-time completion,
    // attention flag resolution, and pending request completion.
    const { data: completion, error: completionError } = await supabase
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
      logger.error(
        'Failed to create task completion',
        { error: completionError, taskId },
        'TasksAPI'
      );
      return apiInternalError('Failed to complete task');
    }

    if (task.created_by !== user.id) {
      const { data: profile } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('username, display_name:name')
        .eq('id', user.id)
        .single();
      const completerName = profile?.display_name || profile?.username || 'Someone';
      await new NotificationService(supabase).createNotification({
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
  },
});
