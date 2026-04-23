/**
 * Task Attention Flag API
 *
 * POST /api/tasks/[id]/attention - Flag a task as needing attention
 *
 * Created: 2026-02-05
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiNotFound,
  apiValidationError,
  apiInternalError,
  apiSuccess,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import {  rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { DATABASE_TABLES } from '@/config/database-tables';
import { attentionFlagSchema } from '@/lib/schemas/tasks';
import { TASK_STATUSES } from '@/config/tasks';
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
  try {
    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));}

    const body = await request.json().catch(() => ({}));
    const result = attentionFlagSchema.safeParse(body);
    if (!result.success) {return apiValidationError('Validation failed', result.error.flatten());}

    const flagData = result.data;

    const { data: task, error: taskError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, created_by')
      .eq('id', taskId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {return apiNotFound('Task not found');}
      logger.error('Failed to fetch task', { error: taskError, taskId }, 'TasksAPI');
      return apiInternalError();
    }

    const { data: flag, error: flagError } = await supabase
      .from(DATABASE_TABLES.TASK_ATTENTION_FLAGS)
      .insert({ task_id: taskId, flagged_by: user.id, message: flagData.message || null })
      .select('id, flagged_by, message, created_at')
      .single();

    if (flagError) {
      logger.error('Failed to create attention flag', { error: flagError, taskId }, 'TasksAPI');
      return apiInternalError('Failed to flag task');
    }

    await supabase.from(DATABASE_TABLES.TASKS).update({ current_status: TASK_STATUSES.NEEDS_ATTENTION }).eq('id', taskId);

    const { data: profile } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('username, display_name')
      .eq('id', user.id)
      .single();
    const flaggerName = profile?.display_name || profile?.username || 'Someone';
    const notificationService = new NotificationService(supabase);

    if (task.created_by !== user.id) {
      await notificationService.createNotification({
        recipientUserId: task.created_by,
        type: 'task_attention',
        title: `${flaggerName} says: "${task.title}" needs attention`,
        message: flagData.message || null,
        actionUrl: `/dashboard/tasks/${taskId}`,
        sourceEntityType: 'task',
        sourceEntityId: taskId,
      });
    }

    await notificationService.createBroadcastNotification({
      excludeUserId: user.id,
      type: 'task_attention',
      title: `Task needs attention: "${task.title}"`,
      message: flagData.message || null,
      actionUrl: `/dashboard/tasks/${taskId}`,
      sourceEntityType: 'task',
      sourceEntityId: taskId,
    });

    return apiSuccess({ flag }, { status: 201 });
  } catch (err) {
    logger.error('Exception in POST /api/tasks/[id]/attention', { error: err }, 'TasksAPI');
    return apiInternalError();
  }
});
