import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

/**
 * Get user's favorited projects
 * GET /api/projects/favorites
 */
async function handleGetFavorites(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient();
    const user = request.user;

    // Get favorited project IDs
    const { data: favorites, error: favoritesError } = await supabase
      .from('project_favorites')
      .select('project_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      logger.error('Error fetching favorites:', favoritesError);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Get full project data for favorited projects
    const projectIds = favorites.map(f => f.project_id);
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
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
      logger.error('Error fetching favorited projects:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch favorited projects' }, { status: 500 });
    }

    // Fetch profiles separately for each project creator
    const userIds = [...new Set((projects || []).map(p => p.user_id).filter(Boolean))];
    const profilesMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (!profilesError && profiles) {
        profiles.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }
    }

    // Map projects with favorite metadata and profiles
    const projectsWithFavorite = (projects || []).map(project => ({
      ...project,
      favorited_at: favorites.find(f => f.project_id === project.id)?.created_at,
      profiles: project.user_id ? profilesMap.get(project.user_id) : null,
    }));

    return NextResponse.json({
      success: true,
      data: projectsWithFavorite,
      count: projectsWithFavorite.length,
    });
  } catch (error) {
    logger.error('Unexpected error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(handleGetFavorites);
