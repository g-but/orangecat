/**
 * Task Contributions Analytics API
 *
 * GET /api/task-analytics/contributions - Get completions per person
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// Type for completion row (without profile join)
interface CompletionRow {
  id: string;
  completed_by: string;
  completed_at: string;
  duration_minutes: number | null;
  task: {
    id: string;
    title: string;
    category: string;
  } | null;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * GET /api/task-analytics/contributions
 *
 * Get task completions grouped by person
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
    const days = parseInt(searchParams.get('days') || '30', 10);
    const categoryFilter = searchParams.get('category') || undefined;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get completions with task info (no profile join - FK goes to auth.users not profiles)
    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .select(
        `
        id,
        completed_by,
        completed_at,
        duration_minutes,
        task:tasks!task_completions_task_id_fkey(
          id,
          title,
          category
        )
      `
      )
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch contributions', { error }, 'TaskAnalyticsAPI');
      return ApiResponses.internalServerError('Failed to fetch contributions');
    }

    const completions = (data || []) as CompletionRow[];

    // Fetch profiles separately for all unique completers
    const uniqueUserIds = [...new Set(completions.map(c => c.completed_by))];
    const profilesMap = new Map<string, ProfileRow>();

    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id, username, display_name, avatar_url')
        .in('id', uniqueUserIds);

      for (const p of (profiles || []) as ProfileRow[]) {
        profilesMap.set(p.id, p);
      }
    }

    // Filter by category if specified
    let filteredCompletions = completions;
    if (categoryFilter) {
      filteredCompletions = filteredCompletions.filter(c => c.task?.category === categoryFilter);
    }

    // Aggregate by user
    const contributionsByUser = new Map<
      string,
      {
        user: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
        };
        totalCompletions: number;
        totalMinutes: number;
        byCategory: Record<string, number>;
      }
    >();

    for (const completion of filteredCompletions) {
      const userId = completion.completed_by;
      const profile = profilesMap.get(userId);
      const task = completion.task;

      if (!profile) {
        continue;
      }

      if (!contributionsByUser.has(userId)) {
        contributionsByUser.set(userId, {
          user: profile,
          totalCompletions: 0,
          totalMinutes: 0,
          byCategory: {},
        });
      }

      const userStats = contributionsByUser.get(userId)!;
      userStats.totalCompletions += 1;
      userStats.totalMinutes += completion.duration_minutes || 0;

      if (task?.category) {
        userStats.byCategory[task.category] = (userStats.byCategory[task.category] || 0) + 1;
      }
    }

    // Convert to array and sort by total completions
    const contributions = Array.from(contributionsByUser.values()).sort(
      (a, b) => b.totalCompletions - a.totalCompletions
    );

    // Calculate total
    const totalCompletions = contributions.reduce((sum, c) => sum + c.totalCompletions, 0);
    const totalMinutes = contributions.reduce((sum, c) => sum + c.totalMinutes, 0);

    return createSuccessResponse({
      contributions,
      summary: {
        totalCompletions,
        totalMinutes,
        uniqueContributors: contributions.length,
        averagePerPerson:
          contributions.length > 0 ? Math.round(totalCompletions / contributions.length) : 0,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    logger.error(
      'Exception in GET /api/task-analytics/contributions',
      { error: err },
      'TaskAnalyticsAPI'
    );
    return ApiResponses.internalServerError();
  }
}
