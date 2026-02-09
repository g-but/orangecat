/**
 * Task Fairness Analytics API
 *
 * GET /api/task-analytics/fairness - Get unique completers per recurring task
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { TASK_TYPES } from '@/config/tasks';
import { logger } from '@/utils/logger';

// Types for query results
interface TaskRow {
  id: string;
  title: string;
  category: string;
  task_type: string;
}

interface CompletionRow {
  id: string;
  task_id: string;
  completed_by: string;
  completed_at: string;
  completer: {
    id: string;
    username: string;
    display_name: string | null;
  } | null;
}

/**
 * GET /api/task-analytics/fairness
 *
 * Get fairness metrics for recurring tasks - how evenly work is distributed
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90', 10);
    const categoryFilter = searchParams.get('category') || undefined;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get recurring tasks (not one_time)
    let tasksQuery = supabase
      .from(DATABASE_TABLES.TASKS)
      .select('id, title, category, task_type')
      .eq('is_archived', false)
      .neq('task_type', TASK_TYPES.ONE_TIME);

    if (categoryFilter) {
      tasksQuery = tasksQuery.eq('category', categoryFilter);
    }

    const { data: tasksData, error: tasksError } = await tasksQuery;

    if (tasksError) {
      logger.error('Failed to fetch recurring tasks', { error: tasksError }, 'TaskAnalyticsAPI');
      return ApiResponses.internalServerError('Failed to fetch tasks');
    }

    const recurringTasks = (tasksData || []) as TaskRow[];

    if (recurringTasks.length === 0) {
      return createSuccessResponse({
        fairnessMetrics: [],
        summary: {
          totalRecurringTasks: 0,
          averageUniqueCompleters: 0,
          tasksWithSingleCompleter: 0,
          period: {
            days,
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
          },
        },
      });
    }

    // Get completions for these tasks within the time period
    const taskIds = recurringTasks.map(t => t.id);

    const { data: completionsData, error: completionsError } = await supabase
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .select(
        `
        id,
        task_id,
        completed_by,
        completed_at,
        completer:profiles!task_completions_completed_by_fkey(
          id,
          username,
          display_name
        )
      `
      )
      .in('task_id', taskIds)
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: false });

    if (completionsError) {
      logger.error('Failed to fetch completions', { error: completionsError }, 'TaskAnalyticsAPI');
      return ApiResponses.internalServerError('Failed to fetch completions');
    }

    const completions = (completionsData || []) as CompletionRow[];

    // Calculate fairness metrics per task
    const taskMetrics = recurringTasks.map(task => {
      const taskCompletions = completions.filter(c => c.task_id === task.id);

      // Count unique completers
      const uniqueCompleters = new Map<
        string,
        { id: string; username: string; display_name: string | null; count: number }
      >();

      for (const completion of taskCompletions) {
        const completer = completion.completer;
        if (!completer) {
          continue;
        }

        const existing = uniqueCompleters.get(completer.id);
        if (existing) {
          existing.count += 1;
        } else {
          uniqueCompleters.set(completer.id, {
            id: completer.id,
            username: completer.username,
            display_name: completer.display_name,
            count: 1,
          });
        }
      }

      const completersArray = Array.from(uniqueCompleters.values()).sort(
        (a, b) => b.count - a.count
      );

      // Calculate fairness score (0-100)
      // Higher is better (more evenly distributed)
      let fairnessScore = 100;
      if (completersArray.length > 1 && taskCompletions.length > 0) {
        // Calculate variance in completion counts
        const avgCount = taskCompletions.length / completersArray.length;
        const variance =
          completersArray.reduce((sum, c) => sum + Math.pow(c.count - avgCount, 2), 0) /
          completersArray.length;
        const stdDev = Math.sqrt(variance);
        // Normalize: if everyone did same amount, stdDev = 0, score = 100
        // Higher stdDev = more imbalance = lower score
        const normalizedScore = Math.max(0, 100 - (stdDev / avgCount) * 50);
        fairnessScore = Math.round(normalizedScore);
      } else if (completersArray.length === 1 && taskCompletions.length > 3) {
        // Single person doing all the work repeatedly is unfair
        fairnessScore = 25;
      } else if (taskCompletions.length === 0) {
        // No completions, neutral score
        fairnessScore = 50;
      }

      return {
        task: {
          id: task.id,
          title: task.title,
          category: task.category,
          task_type: task.task_type,
        },
        totalCompletions: taskCompletions.length,
        uniqueCompleterCount: uniqueCompleters.size,
        completers: completersArray,
        fairnessScore,
        fairnessLevel:
          fairnessScore >= 80
            ? 'good'
            : fairnessScore >= 50
              ? 'moderate'
              : ('needs_attention' as const),
      };
    });

    // Sort by fairness score (lowest first to highlight problems)
    taskMetrics.sort((a, b) => a.fairnessScore - b.fairnessScore);

    // Calculate summary
    const tasksWithCompletions = taskMetrics.filter(t => t.totalCompletions > 0);
    const avgUniqueCompleters =
      tasksWithCompletions.length > 0
        ? tasksWithCompletions.reduce((sum, t) => sum + t.uniqueCompleterCount, 0) /
          tasksWithCompletions.length
        : 0;

    return createSuccessResponse({
      fairnessMetrics: taskMetrics,
      summary: {
        totalRecurringTasks: recurringTasks.length,
        averageUniqueCompleters: Math.round(avgUniqueCompleters * 10) / 10,
        tasksWithSingleCompleter: taskMetrics.filter(
          t => t.uniqueCompleterCount === 1 && t.totalCompletions > 3
        ).length,
        tasksNeedingAttention: taskMetrics.filter(t => t.fairnessLevel === 'needs_attention')
          .length,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    logger.error(
      'Exception in GET /api/task-analytics/fairness',
      { error: err },
      'TaskAnalyticsAPI'
    );
    return ApiResponses.internalServerError();
  }
}
