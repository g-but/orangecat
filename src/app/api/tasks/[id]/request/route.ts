/**
 * Task Request API
 *
 * POST /api/tasks/[id]/request - Request someone to do a task
 *
 * If requested_user_id is provided, sends to specific user.
 * If requested_user_id is null/omitted, broadcasts to ALL team members.
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse, HttpStatus } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskRequestSchema } from '@/lib/schemas/tasks';
import { TASK_STATUSES } from '@/config/tasks';
import { NotificationService } from '@/lib/services/notifications';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Types for query results
interface TaskRow {
  id: string;
  title: string;
}

interface ProfileRow {
  username: string | null;
  display_name: string | null;
}

/**
 * POST /api/tasks/[id]/request
 *
 * Create a task request
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
    const result = taskRequestSchema.safeParse(body);

    if (!result.success) {
      return ApiResponses.validationError('Validation failed', result.error.flatten());
    }

    const requestData = result.data;
    const isBroadcast = !requestData.requested_user_id;

    // Verify task exists
    const { data: taskData, error: taskError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title')
      .eq('id', taskId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return ApiResponses.notFound('Task');
      }
      logger.error('Failed to fetch task', { error: taskError, taskId }, 'TasksAPI');
      return ApiResponses.internalServerError();
    }

    const task = taskData as unknown as TaskRow;

    // If specific user requested, verify they exist
    if (requestData.requested_user_id) {
      const { data: requestedUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', requestData.requested_user_id)
        .single();

      if (userError || !requestedUser) {
        return ApiResponses.notFound('Requested user');
      }
    }

    // Create request record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taskRequest, error: requestError } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .insert({
        task_id: taskId,
        requested_by: user.id,
        requested_user_id: requestData.requested_user_id || null,
        message: requestData.message || null,
        status: 'pending',
      })
      .select(
        `
        id,
        requested_by,
        requested_user_id,
        message,
        status,
        is_broadcast,
        created_at
      `
      )
      .single();

    if (requestError) {
      logger.error('Failed to create task request', { error: requestError, taskId }, 'TasksAPI');
      return ApiResponses.internalServerError('Failed to create request');
    }

    // Update task status to requested
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from(DATABASE_TABLES.TASKS)
      .update({ current_status: TASK_STATUSES.REQUESTED })
      .eq('id', taskId);

    // Send notifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationService = new NotificationService(supabase as any);

    // Get requester's name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();

    const requesterProfile = profileData as ProfileRow | null;
    const requesterName = requesterProfile?.display_name || requesterProfile?.username || 'Someone';

    if (isBroadcast) {
      // Broadcast to all team members
      await notificationService.createBroadcastNotification({
        excludeUserId: user.id,
        type: 'task_broadcast',
        title: `${requesterName} is asking for help: "${task.title}"`,
        message: requestData.message || null,
        actionUrl: `/dashboard/tasks/${taskId}`,
        sourceEntityType: 'task',
        sourceEntityId: taskId,
      });
    } else {
      // Notify specific user
      await notificationService.createNotification({
        recipientUserId: requestData.requested_user_id!,
        type: 'task_request',
        title: `${requesterName} is asking you: "${task.title}"`,
        message: requestData.message || null,
        actionUrl: `/dashboard/tasks/${taskId}`,
        sourceEntityType: 'task',
        sourceEntityId: taskId,
      });
    }

    return createSuccessResponse(
      { request: taskRequest },
      HttpStatus.CREATED,
      isBroadcast ? 'Request sent to all' : 'Request sent'
    );
  } catch (err) {
    logger.error('Exception in POST /api/tasks/[id]/request', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}
