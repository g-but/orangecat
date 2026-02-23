import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';

/**
 * Get user's favorited projects
 * GET /api/projects/favorites
 */
async function handleGetFavorites(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient();
    const user = request.user;

    // Get favorited project IDs
    const { data: favorites, error: favoritesError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(DATABASE_TABLES.PROJECT_FAVORITES) as any)
        .select('project_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (favoritesError) {
      logger.error('Failed to fetch favorites', {
        userId: user.id,
        error: favoritesError.message,
      });
      return apiInternalError('Failed to fetch favorites');
    }

    if (!favorites || favorites.length === 0) {
      return apiSuccess({ data: [], count: 0 }, { cache: 'SHORT' });
    }

    // Get full project data for favorited projects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectIds = favorites.map((f: any) => f.project_id);
    const { data: projects, error: projectsError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(getTableName('project')) as any)
        .select(
          `
        id,
        title,
        description,
        category,
        tags,
        status,
        bitcoin_address,
        lightning_address,
        goal_amount,
        currency,
        raised_amount,
        bitcoin_balance_btc,
        bitcoin_balance_updated_at,
        created_at,
        updated_at,
        user_id
      `
        )
        .in('id', projectIds)
        .order('created_at', { ascending: false });

    if (projectsError) {
      logger.error('Failed to fetch favorited projects', {
        userId: user.id,
        projectCount: projectIds.length,
        error: projectsError.message,
      });
      return apiInternalError('Failed to fetch favorited projects');
    }

    // Fetch profiles separately for each project creator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = [...new Set((projects || []).map((p: any) => p.user_id).filter(Boolean))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } =
        await // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from(DATABASE_TABLES.PROFILES) as any)
          .select('id, username, name, avatar_url')
          .in('id', userIds);

      if (!profilesError && profiles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profiles.forEach((profile: any) => {
          profilesMap.set(profile.id, profile);
        });
      }
    }

    // Map projects with favorite metadata and profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectsWithFavorite = (projects || []).map((project: any) => ({
      ...project,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      favorited_at: favorites.find((f: any) => f.project_id === project.id)?.created_at,
      profiles: project.user_id ? profilesMap.get(project.user_id) : null,
    }));

    logger.info('Fetched favorites successfully', {
      userId: user.id,
      count: projectsWithFavorite.length,
    });

    return apiSuccess(
      { data: projectsWithFavorite, count: projectsWithFavorite.length },
      { cache: 'SHORT' }
    );
  } catch (error) {
    logger.error('Unexpected error fetching favorites', { error });
    return apiInternalError('Internal server error');
  }
}

export const GET = withAuth(handleGetFavorites);
