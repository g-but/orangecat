import { logger } from '@/utils/logger';
import { withOptionalAuth } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  handleApiError,
} from '@/lib/api/standardResponse';
import { getTableName } from '@/config/entity-registry';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { DATABASE_TABLES } from '@/config/database-tables';

const DEFAULT_CAMPAIGN_DURATION_DAYS = 30;

export const GET = withOptionalAuth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: projectId } = await params;
    const idValidation = getValidationError(validateUUID(projectId, 'project ID'));
    if (idValidation) {return idValidation;}
    const { supabase } = req;

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

    // Get real supporter count from project_support table
    const { count: supportCount } = await supabase
      .from(DATABASE_TABLES.PROJECT_SUPPORT)
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'confirmed');
    const donorCount = supportCount ?? 0;

    // Calculate progress
    const progressPercent =
      project.goal_amount > 0
        ? Math.min((project.raised_amount / project.goal_amount) * 100, 100)
        : 0;

    // Calculate days remaining (default campaign duration from creation date)
    const createdDate = new Date(project.created_at);
    const endDate = new Date(createdDate.getTime() + DEFAULT_CAMPAIGN_DURATION_DAYS * 24 * 60 * 60 * 1000);
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
        daysPercentElapsed: Math.min((daysSinceCreation / DEFAULT_CAMPAIGN_DURATION_DAYS) * 100, 100),
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
      visibility: project.status === 'active' ? 'public' : project.status,
    });
  } catch (error) {
    logger.error('Error fetching project stats', { error, projectId: (await params).id }, 'Projects');
    return handleApiError(error);
  }
});
