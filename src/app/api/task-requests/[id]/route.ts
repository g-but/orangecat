/**
 * Single Task Request API
 *
 * PATCH /api/task-requests/[id] - Respond to a task request (accept/decline)
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
  apiInternalError,
  apiSuccess,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { requestResponseSchema } from '@/lib/schemas/tasks';
import { TASK_STATUSES, REQUEST_STATUSES } from '@/config/tasks';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';
import { validateUUID, getValidationError } from '@/lib/api/validation';

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: requestId } = await context.params;
  const idValidation = getValidationError(validateUUID(requestId, 'request ID'));
  if (idValidation) {return idValidation;}
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {return apiUnauthorized('Authentication required');}

    const body = await request.json();
    const result = requestResponseSchema.safeParse(body);
    if (!result.success) {return apiValidationError('Validation failed', result.error.flatten());}
    const d = result.data;

    // Fetch the request with task info
    const { data: taskRequest, error: fetchError } = await supabase
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .select('*, task:tasks!task_requests_task_id_fkey(id, title)')
      .eq('id', requestId).single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {return apiNotFound('Request not found');}
      logger.error('Failed to fetch task request', { error: fetchError, requestId }, 'TaskRequestsAPI');
      return apiInternalError();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tr = taskRequest as any;
    const canRespond = tr.requested_user_id === user.id || tr.requested_user_id === null;
    if (!canRespond) {return apiForbidden('You cannot respond to this request');}
    if (tr.status !== REQUEST_STATUSES.PENDING) {return apiBadRequest('This request has already been answered');}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedRequest, error: updateError } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .update({ status: d.status, response_message: d.response_message || null, responded_by: user.id })
      .eq('id', requestId).select().single();

    if (updateError) {
      logger.error('Failed to update task request', { error: updateError, requestId }, 'TaskRequestsAPI');
      return apiInternalError('Failed to respond to request');
    }

    // Update task status if accepted
    if (d.status === REQUEST_STATUSES.ACCEPTED) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from(DATABASE_TABLES.TASKS).update({ current_status: TASK_STATUSES.IN_PROGRESS }).eq('id', tr.task_id);
    }

    // Notify the requester
    const { data: profile } = await supabase.from(DATABASE_TABLES.PROFILES).select('username, display_name').eq('id', user.id).single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responderName = (profile as any)?.display_name || (profile as any)?.username || 'Someone';
    const taskTitle = tr.task?.title || 'Task';
    const taskId = tr.task?.id || tr.task_id;
    const notifTitle = d.status === REQUEST_STATUSES.ACCEPTED ? `${responderName} accepted: "${taskTitle}"` : `${responderName} declined: "${taskTitle}"`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await new NotificationService(supabase as any).createNotification({
      recipientUserId: tr.requested_by,
      type: 'task_request',
      title: notifTitle,
      message: d.response_message || null,
      actionUrl: `/dashboard/tasks/${taskId}`,
      sourceEntityType: 'task',
      sourceEntityId: taskId,
    });

    return apiSuccess({ request: updatedRequest });
  } catch (err) {
    logger.error('Exception in PATCH /api/task-requests/[id]', { error: err }, 'TaskRequestsAPI');
    return apiInternalError();
  }
}
