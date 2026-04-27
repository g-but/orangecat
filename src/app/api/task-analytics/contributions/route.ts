/**
 * Task Contributions Analytics API
 *
 * GET /api/task-analytics/contributions - Get completions per person
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiInternalError, apiSuccess } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import {
  aggregateContributions,
  type CompletionRow,
  type ProfileRow,
} from '@/services/tasks/contributionAnalytics';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { supabase } = request;
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10)));
    const categoryFilter = searchParams.get('category') || undefined;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from(DATABASE_TABLES.TASK_COMPLETIONS)
      .select(
        'id, completed_by, completed_at, duration_minutes, task:tasks!task_completions_task_id_fkey(id, title, category)'
      )
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch contributions', { error }, 'TaskAnalyticsAPI');
      return apiInternalError('Failed to fetch contributions');
    }

    const completions = (data || []) as unknown as CompletionRow[];
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

    const contributions = aggregateContributions(completions, profilesMap, categoryFilter);
    const totalCompletions = contributions.reduce((sum, c) => sum + c.totalCompletions, 0);
    const totalMinutes = contributions.reduce((sum, c) => sum + c.totalMinutes, 0);

    return apiSuccess({
      contributions,
      summary: {
        totalCompletions,
        totalMinutes,
        uniqueContributors: contributions.length,
        averagePerPerson:
          contributions.length > 0 ? Math.round(totalCompletions / contributions.length) : 0,
        period: { days, startDate: startDate.toISOString(), endDate: new Date().toISOString() },
      },
    });
  } catch (err) {
    logger.error(
      'Exception in GET /api/task-analytics/contributions',
      { error: err },
      'TaskAnalyticsAPI'
    );
    return apiInternalError();
  }
});
