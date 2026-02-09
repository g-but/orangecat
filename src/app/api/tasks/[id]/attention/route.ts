/**
 * Task Attention Flag API
 *
 * POST /api/tasks/[id]/attention - Flag a task as needing attention
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse, HttpStatus } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { attentionFlagSchema } from '@/lib/schemas/tasks';
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
  created_by: string;
}

interface ProfileRow {
  username: string | null;
  display_name: string | null;
}

/**
 * POST /api/tasks/[id]/attention
 *
 * Flag a task as needing attention
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
    const result = attentionFlagSchema.safeParse(body);

    if (!result.success) {
      return ApiResponses.validationError('Validation failed', result.error.flatten());
    }

    const flagData = result.data;

    // Verify task exists
    const { data: taskData, error: taskError } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, created_by')
      .eq('id', taskId)
      .single();

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return ApiResponses.notFound('Aufgabe');
      }
      logger.error('Failed to fetch task', { error: taskError, taskId }, 'TasksAPI');
      return ApiResponses.internalServerError();
    }

    const task = taskData as unknown as TaskRow;

    // Create attention flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: flag, error: flagError } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_ATTENTION_FLAGS)
      .insert({
        task_id: taskId,
        flagged_by: user.id,
        message: flagData.message || null,
      })
      .select(
        `
        id,
        flagged_by,
        message,
        created_at
      `
      )
      .single();

    if (flagError) {
      logger.error('Failed to create attention flag', { error: flagError, taskId }, 'TasksAPI');
      return ApiResponses.internalServerError('Failed to flag task');
    }

    // Update task status to needs_attention
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from(DATABASE_TABLES.TASKS)
      .update({ current_status: TASK_STATUSES.NEEDS_ATTENTION })
      .eq('id', taskId);

    // Send notifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationService = new NotificationService(supabase as any);

    // Get flagger's name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();

    const flaggerProfile = profileData as ProfileRow | null;
    const flaggerName = flaggerProfile?.display_name || flaggerProfile?.username || 'Jemand';

    // Notify task creator if different from flagger
    if (task.created_by !== user.id) {
      await notificationService.createNotification({
        recipientUserId: task.created_by,
        type: 'task_attention',
        title: `${flaggerName} sagt: "${task.title}" braucht Aufmerksamkeit`,
        message: flagData.message || null,
        actionUrl: `/dashboard/tasks/${taskId}`,
        sourceEntityType: 'task',
        sourceEntityId: taskId,
      });
    }

    // Broadcast to all other users
    await notificationService.createBroadcastNotification({
      excludeUserId: user.id,
      type: 'task_attention',
      title: `Aufgabe braucht Aufmerksamkeit: "${task.title}"`,
      message: flagData.message || null,
      actionUrl: `/dashboard/tasks/${taskId}`,
      sourceEntityType: 'task',
      sourceEntityId: taskId,
    });

    return createSuccessResponse({ flag }, HttpStatus.CREATED, 'Aufgabe als dringend markiert');
  } catch (err) {
    logger.error('Exception in POST /api/tasks/[id]/attention', { error: err }, 'TasksAPI');
    return ApiResponses.internalServerError();
  }
}
