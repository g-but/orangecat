/**
 * Single Task Request API
 *
 * PATCH /api/task-requests/[id] - Respond to a task request (accept/decline)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse, HttpStatus } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { requestResponseSchema } from '@/lib/schemas/tasks';
import { TASK_STATUSES, REQUEST_STATUSES } from '@/config/tasks';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Type for task request with joined data
interface TaskRequestRow {
  id: string;
  task_id: string;
  requested_by: string;
  requested_user_id: string | null;
  status: string;
  task: {
    id: string;
    title: string;
  } | null;
}

// Type for profile
interface ProfileRow {
  username: string | null;
  display_name: string | null;
}

/**
 * PATCH /api/task-requests/[id]
 *
 * Respond to a task request
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: requestId } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Parse and validate body
    const body = await request.json();
    const result = requestResponseSchema.safeParse(body);

    if (!result.success) {
      return ApiResponses.validationError('Validation failed', result.error.flatten());
    }

    const responseData = result.data;

    // Fetch the request
    const { data: requestData, error: fetchError } = await supabase
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .select(
        `
        *,
        task:tasks!task_requests_task_id_fkey(id, title)
      `
      )
      .eq('id', requestId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return ApiResponses.notFound('Request');
      }
      logger.error(
        'Failed to fetch task request',
        { error: fetchError, requestId },
        'TaskRequestsAPI'
      );
      return ApiResponses.internalServerError();
    }

    const taskRequest = requestData as unknown as TaskRequestRow;

    // Verify user can respond to this request
    // Either it's a direct request to them, or it's a broadcast
    const canRespond =
      taskRequest.requested_user_id === user.id || // Direct request
      taskRequest.requested_user_id === null; // Broadcast

    if (!canRespond) {
      return ApiResponses.authorizationFailed('You cannot respond to this request');
    }

    // Verify request is still pending
    if (taskRequest.status !== REQUEST_STATUSES.PENDING) {
      return ApiResponses.badRequest('This request has already been answered');
    }

    // Update request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedRequest, error: updateError } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .update({
        status: responseData.status,
        response_message: responseData.response_message || null,
        responded_by: user.id,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update task request',
        { error: updateError, requestId },
        'TaskRequestsAPI'
      );
      return ApiResponses.internalServerError('Failed to respond to request');
    }

    // If accepted, update task status to in_progress
    if (responseData.status === REQUEST_STATUSES.ACCEPTED) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from(DATABASE_TABLES.TASKS)
        .update({ current_status: TASK_STATUSES.IN_PROGRESS })
        .eq('id', taskRequest.task_id);
    }

    // Notify the requester
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationService = new NotificationService(supabase as any);

    // Get responder's name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();

    const responderProfile = profileData as ProfileRow | null;
    const responderName = responderProfile?.display_name || responderProfile?.username || 'Someone';
    const task = taskRequest.task;
    const taskTitle = task?.title || 'Task';
    const taskId = task?.id || taskRequest.task_id;

    const notificationTitle =
      responseData.status === REQUEST_STATUSES.ACCEPTED
        ? `${responderName} accepted: "${taskTitle}"`
        : `${responderName} declined: "${taskTitle}"`;

    await notificationService.createNotification({
      recipientUserId: taskRequest.requested_by,
      type: 'task_request',
      title: notificationTitle,
      message: responseData.response_message || null,
      actionUrl: `/dashboard/tasks/${taskId}`,
      sourceEntityType: 'task',
      sourceEntityId: taskId,
    });

    return createSuccessResponse(
      { request: updatedRequest },
      HttpStatus.OK,
      responseData.status === REQUEST_STATUSES.ACCEPTED ? 'Request accepted' : 'Request declined'
    );
  } catch (err) {
    logger.error('Exception in PATCH /api/task-requests/[id]', { error: err }, 'TaskRequestsAPI');
    return ApiResponses.internalServerError();
  }
}
