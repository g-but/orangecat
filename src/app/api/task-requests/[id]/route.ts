/**
 * Single Task Request API
 *
 * PATCH /api/task-requests/[id] - Respond to a task request (accept/decline)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
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

export const PATCH = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id: requestId } = await context.params;
  const idValidation = getValidationError(validateUUID(requestId, 'request ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  try {
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

    const tr = taskRequest;
    const canRespond = tr.requested_user_id === user.id || tr.requested_user_id === null;
    if (!canRespond) {return apiForbidden('You cannot respond to this request');}
    if (tr.status !== REQUEST_STATUSES.PENDING) {return apiBadRequest('This request has already been answered');}

    const { data: updatedRequest, error: updateError } = await supabase
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .update({ status: d.status, response_message: d.response_message || null, responded_by: user.id })
      .eq('id', requestId).select().single();

    if (updateError) {
      logger.error('Failed to update task request', { error: updateError, requestId }, 'TaskRequestsAPI');
      return apiInternalError('Failed to respond to request');
    }

    // Update task status if accepted
    if (d.status === REQUEST_STATUSES.ACCEPTED) {
      await supabase.from(DATABASE_TABLES.TASKS).update({ current_status: TASK_STATUSES.IN_PROGRESS }).eq('id', tr.task_id);
    }

    // Notify the requester
    const { data: profile } = await supabase.from(DATABASE_TABLES.PROFILES).select('username, display_name').eq('id', user.id).single();
    const responderName = profile?.display_name || profile?.username || 'Someone';
    const taskTitle = tr.task?.title || 'Task';
    const taskId = tr.task?.id || tr.task_id;
    const notifTitle = d.status === REQUEST_STATUSES.ACCEPTED ? `${responderName} accepted: "${taskTitle}"` : `${responderName} declined: "${taskTitle}"`;

    await new NotificationService(supabase).createNotification({
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
});
