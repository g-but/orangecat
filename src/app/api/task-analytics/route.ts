/**
 * Task Analytics API
 *
 * GET /api/task-analytics - Get dashboard stats
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { TASK_STATUSES } from '@/config/tasks';
import { logger } from '@/utils/logger';

/**
 * GET /api/task-analytics
 *
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Get counts for various task states
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

    // Run queries in parallel
    const [
      totalTasksResult,
      pendingTasksResult,
      needsAttentionResult,
      inProgressResult,
      completedTodayResult,
      completedWeekResult,
      myCompletedTodayResult,
      openRequestsResult,
    ] = await Promise.all([
      // Total active tasks
      supabase
        .from(DATABASE_TABLES.TASKS)
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false)
        .not('task_type', 'eq', 'one_time'),

      // Pending (idle) tasks
      supabase
        .from(DATABASE_TABLES.TASKS)
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false)
        .eq('current_status', TASK_STATUSES.IDLE),

      // Tasks needing attention
      supabase
        .from(DATABASE_TABLES.TASKS)
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false)
        .eq('current_status', TASK_STATUSES.NEEDS_ATTENTION),

      // Tasks in progress
      supabase
        .from(DATABASE_TABLES.TASKS)
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false)
        .eq('current_status', TASK_STATUSES.IN_PROGRESS),

      // Completed today (all users)
      supabase
        .from(DATABASE_TABLES.TASK_COMPLETIONS)
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', todayStart),

      // Completed this week (all users)
      supabase
        .from(DATABASE_TABLES.TASK_COMPLETIONS)
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', weekStart),

      // My completions today
      supabase
        .from(DATABASE_TABLES.TASK_COMPLETIONS)
        .select('*', { count: 'exact', head: true })
        .eq('completed_by', user.id)
        .gte('completed_at', todayStart),

      // Open requests (pending requests for me or broadcasts)
      supabase
        .from(DATABASE_TABLES.TASK_REQUESTS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .or(`requested_user_id.eq.${user.id},requested_user_id.is.null`)
        .neq('requested_by', user.id),
    ]);

    // Get recent completions for the feed
    const { data: recentCompletions } = await supabase
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .select(
        `
        id,
        completed_at,
        notes,
        task:tasks!task_completions_task_id_fkey(id, title, category),
        completer:profiles!task_completions_completed_by_fkey(id, username, display_name, avatar_url)
      `
      )
      .order('completed_at', { ascending: false })
      .limit(5);

    // Get tasks needing attention
    const { data: urgentTasks } = await supabase
      .from(DATABASE_TABLES.TASKS)
      .select(
        `
        id,
        title,
        category,
        priority,
        current_status
      `
      )
      .eq('is_archived', false)
      .or(`current_status.eq.${TASK_STATUSES.NEEDS_ATTENTION},priority.eq.urgent`)
      .order('created_at', { ascending: false })
      .limit(5);

    const stats = {
      total: totalTasksResult.count || 0,
      pending: pendingTasksResult.count || 0,
      needsAttention: needsAttentionResult.count || 0,
      inProgress: inProgressResult.count || 0,
      completedToday: completedTodayResult.count || 0,
      completedThisWeek: completedWeekResult.count || 0,
      myCompletedToday: myCompletedTodayResult.count || 0,
      openRequests: openRequestsResult.count || 0,
    };

    return createSuccessResponse({
      stats,
      recentCompletions: recentCompletions || [],
      urgentTasks: urgentTasks || [],
    });
  } catch (err) {
    logger.error('Exception in GET /api/task-analytics', { error: err }, 'TaskAnalyticsAPI');
    return ApiResponses.internalServerError();
  }
}
