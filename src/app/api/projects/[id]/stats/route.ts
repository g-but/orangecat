import { logger } from '@/utils/logger';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { apiSuccess, apiNotFound, handleApiError } from '@/lib/api/standardResponse';
import { getTableName } from '@/config/entity-registry';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { ENTITY_STATUS } from '@/config/database-constants';
import { getEntityFundingStats } from '@/services/wallets/funding-stats';
import { convertBtcToOrNull } from '@/services/currency/rates.server';

const DEFAULT_CAMPAIGN_DURATION_DAYS = 30;

export const GET = withOptionalAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: projectId } = await params;
      const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
      if (idValidation) {
        return idValidation;
      }
      const { supabase } = req;

      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from(getTableName('project'))
        .select(
          `
        id,
        title,
        description,
        goal_amount,
        currency,
        bitcoin_address,
        status,
        created_at,
        updated_at,
        user_id,
        category
      `
        )
        .eq('id', projectId)
        .single();
      const project = projectData;

      if (projectError || !project) {
        return apiNotFound('Project not found');
      }

      // Honest funding figures: the settled `contributions` ledger is the only
      // source of raised/supporter numbers. (The raised_amount column is dead,
      // and project_support rows are unverified self-reports — neither is money.)
      const fundingStats = await getEntityFundingStats(supabase, 'project', projectId);
      const raisedBtc = fundingStats?.totalBtc ?? 0;
      const supporterCount = fundingStats?.contributorCount ?? 0;
      // The goal is written in the project's own currency but money arrives in
      // Bitcoin, so every fiat figure below depends on a real rate. Without one
      // we report null rather than 0 — "we can't say" is true, "nothing raised"
      // would be a lie about someone's fundraiser.
      const goalCurrency = ((project.currency as string) || 'BTC').toUpperCase();
      const raisedAmount = raisedBtc > 0 ? await convertBtcToOrNull(raisedBtc, goalCurrency) : 0;
      const fiatUnavailable = raisedAmount === null;

      const progressPercent =
        raisedAmount !== null && project.goal_amount > 0
          ? Math.min((raisedAmount / project.goal_amount) * 100, 100)
          : null;

      // Calculate days remaining (default campaign duration from creation date)
      const createdDate = new Date(project.created_at);
      const endDate = new Date(
        createdDate.getTime() + DEFAULT_CAMPAIGN_DURATION_DAYS * 24 * 60 * 60 * 1000
      );
      const now = new Date();
      const daysRemaining = Math.max(
        0,
        Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      );

      // Calculate funding rate
      const daysSinceCreation = Math.max(
        1,
        Math.ceil((now.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000))
      );
      const dailyFundingRate = raisedAmount !== null ? raisedAmount / daysSinceCreation : null;

      // Get project category and related projects
      const { data: relatedProjectsData, error: _relatedError } = await supabase
        .from(getTableName('project'))
        .select('id, title')
        .eq('category', project.category || '')
        .neq('id', projectId)
        .limit(5);
      const relatedProjects = relatedProjectsData;

      const categoryRank = relatedProjects?.length || 0;

      return apiSuccess({
        projectId: project.id,
        title: project.title,
        fundingMetrics: {
          goalAmount: project.goal_amount,
          raisedAmount,
          raisedBtc,
          /** True when no Bitcoin rate was available, so every fiat field is null. */
          fiatUnavailable,
          progressPercent:
            progressPercent === null ? null : Math.round(progressPercent * 100) / 100,
          remaining: raisedAmount === null ? null : Math.max(0, project.goal_amount - raisedAmount),
          supporterCount,
          averageContribution:
            raisedAmount !== null && supporterCount > 0
              ? Math.round(raisedAmount / supporterCount)
              : null,
        },
        timeMetrics: {
          createdAt: project.created_at,
          daysActive: daysSinceCreation,
          daysRemaining,
          endDate: endDate.toISOString(),
          daysPercentElapsed: Math.min(
            (daysSinceCreation / DEFAULT_CAMPAIGN_DURATION_DAYS) * 100,
            100
          ),
        },
        performanceMetrics: {
          dailyFundingRate: dailyFundingRate === null ? null : Math.round(dailyFundingRate),
          projectedTotal:
            raisedAmount === null || dailyFundingRate === null
              ? null
              : Math.round(raisedAmount + dailyFundingRate * daysRemaining),
          willReachGoal:
            raisedAmount === null || dailyFundingRate === null
              ? null
              : raisedAmount + dailyFundingRate * daysRemaining >= project.goal_amount,
          category: project.category || 'uncategorized',
          categoryRank,
        },
        status: project.status,
        visibility: project.status === ENTITY_STATUS.ACTIVE ? 'public' : project.status,
      });
    } catch (error) {
      logger.error(
        'Error fetching project stats',
        { error, projectId: (await params).id },
        'Projects'
      );
      return handleApiError(error);
    }
  }
);
