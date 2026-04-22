/**
 * Task Request API
 *
 * POST /api/tasks/[id]/request - Request someone to do a task
 *
 * If requested_user_id is provided, sends to specific user.
 * If omitted, broadcasts to ALL team members.
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
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskRequestSchema } from '@/lib/schemas/tasks';
import { TASK_STATUSES } from '@/config/tasks';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: taskId } = await context.params;
  const idValidation = getValidationError(validateUUID(taskId, 'task ID'));
  if (idValidation) {return idValidation;}
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {return apiUnauthorized('Authentication required');}

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

    const body = await request.json().catch(() => ({}));
    const result = taskRequestSchema.safeParse(body);
    if (!result.success) {return apiValidationError('Validation failed', result.error.flatten());}
    const d = result.data;

    // Verify task exists
    const { data: task, error: taskError } = await supabase.from(DATABASE_TABLES.TASKS).select('id, title').eq('id', taskId).single();
    if (taskError) {return taskError.code === 'PGRST116' ? apiNotFound('Task not found') : apiInternalError();}

    // If specific user, verify they exist
    if (d.requested_user_id) {
      const { data: target, error: userError } = await supabase.from(DATABASE_TABLES.PROFILES).select('id').eq('id', d.requested_user_id).single();
      if (userError || !target) {return apiNotFound('Requested user not found');}
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taskRequest, error: requestError } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .insert({ task_id: taskId, requested_by: user.id, requested_user_id: d.requested_user_id || null, message: d.message || null, status: 'pending' })
      .select('id, requested_by, requested_user_id, message, status, is_broadcast, created_at')
      .single();

    if (requestError) { logger.error('Failed to create task request', { error: requestError, taskId }, 'TasksAPI'); return apiInternalError('Failed to create request'); }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from(DATABASE_TABLES.TASKS).update({ current_status: TASK_STATUSES.REQUESTED }).eq('id', taskId);

    // Send notification
    const { data: profile } = await supabase.from(DATABASE_TABLES.PROFILES).select('username, display_name').eq('id', user.id).single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requesterName = (profile as any)?.display_name || (profile as any)?.username || 'Someone';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationService = new NotificationService(supabase as any);
    const notifBase = { title: '', message: d.message || null, actionUrl: `/dashboard/tasks/${taskId}`, sourceEntityType: 'task' as const, sourceEntityId: taskId };

    if (!d.requested_user_id) {
      await notificationService.createBroadcastNotification({ ...notifBase, excludeUserId: user.id, type: 'task_broadcast', title: `${requesterName} is asking for help: "${(task as any).title}"` });
    } else {
      await notificationService.createNotification({ ...notifBase, recipientUserId: d.requested_user_id, type: 'task_request', title: `${requesterName} is asking you: "${(task as any).title}"` });
    }

    return apiSuccess({ request: taskRequest }, { status: 201 });
  } catch (err) {
    logger.error('Exception in POST /api/tasks/[id]/request', { error: err }, 'TasksAPI');
    return apiInternalError();
  }
}
