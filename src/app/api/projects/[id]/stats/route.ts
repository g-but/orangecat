import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';
import { withOptionalAuth } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  handleApiError,
} from '@/lib/api/standardResponse';
import { getTableName } from '@/config/entity-registry';

export const GET = withOptionalAuth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: projectId } = await params;
    const supabase = await createServerClient();

    // Get project details
    const { data: projectData, error: projectError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(getTableName('project')) as any)
      .select(
        `
        id,
        title,
        description,
        goal_amount,
        raised_amount,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = projectData as any;

    if (projectError || !project) {
      return apiNotFound('Campaign not found');
    }

    // Get transaction/donation count (if transactions table exists)
    // For now, we'll calculate based on raised amount
    const donorCount = project.raised_amount > 0 ? Math.ceil(project.raised_amount / 10000) : 0;

    // Calculate progress
    const progressPercent =
      project.goal_amount > 0
        ? Math.min((project.raised_amount / project.goal_amount) * 100, 100)
        : 0;

    // Calculate days remaining (30 days from creation by default)
    const createdDate = new Date(project.created_at);
    const endDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
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
    const dailyFundingRate = project.raised_amount / daysSinceCreation;

    // Get project category and related projects
    const { data: relatedProjectsData, error: _relatedError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(getTableName('project')) as any)
      .select('id, title, raised_amount')
      .eq('category', project.category || '')
      .neq('id', projectId)
      .limit(5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relatedProjects = relatedProjectsData as any[];

    const categoryRank = relatedProjects?.length || 0;

    return apiSuccess({
      projectId: project.id,
      title: project.title,
      fundingMetrics: {
        goalAmount: project.goal_amount,
        raisedAmount: project.raised_amount,
        progressPercent: Math.round(progressPercent * 100) / 100,
        remaining: Math.max(0, project.goal_amount - project.raised_amount),
        donorCount,
        averageDonation: donorCount > 0 ? Math.round(project.raised_amount / donorCount) : 0,
      },
      timeMetrics: {
        createdAt: project.created_at,
        daysActive: daysSinceCreation,
        daysRemaining,
        endDate: endDate.toISOString(),
        daysPercentElapsed: Math.min((daysSinceCreation / 30) * 100, 100),
      },
      performanceMetrics: {
        dailyFundingRate: Math.round(dailyFundingRate),
        projectedTotal: Math.round(project.raised_amount + dailyFundingRate * daysRemaining),
        willReachGoal:
          project.raised_amount + dailyFundingRate * daysRemaining >= project.goal_amount,
        category: project.category || 'uncategorized',
        categoryRank,
      },
      status: project.status,
      visibility: 'public', // MVP: all projects are public
    });
  } catch (error) {
    logger.error('Error fetching project stats', { error, projectId: (await params).id }, 'Projects');
    return handleApiError(error);
  }
});
