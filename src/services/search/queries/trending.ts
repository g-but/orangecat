/**
 * Trending Content Queries
 *
 * Fetches recently active projects and profiles for the trending/discovery view.
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { PUBLIC_SEARCH_STATUSES } from '@/config/project-statuses';
import { getTableName } from '@/config/entity-registry';
import type {
  SearchProfile,
  SearchFundingPage,
  RawSearchProfile,
  RawSearchProject,
} from '../types';
import { buildProfileMap } from './helpers';

/**
 * Get trending content
 */
export async function getTrending(): Promise<{
  projects: SearchFundingPage[];
  profiles: SearchProfile[];
}> {
  try {
    const [projectsData, profilesData] = await Promise.all([
      supabase
        .from(getTableName('project'))
        .select(
          `
          id, user_id, title, description, bitcoin_address,
          created_at, updated_at, category, status, goal_amount, raised_amount,
          cover_image_url
        `
        )
        .in('status', PUBLIC_SEARCH_STATUSES as string[])
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id, username, name, bio, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Process projects with profile data
    let projects: SearchFundingPage[] = [];
    if (!projectsData.error && projectsData.data) {
      const projectResults = projectsData.data as RawSearchProject[];
      const userIds = [...new Set(projectResults.map(p => p.user_id))];
      const profileMap = await buildProfileMap(userIds);

      projects = projectResults.map(project => {
        const coverImageUrl = project.cover_image_url;
        const { cover_image_url: _coverImg, ...rest } = project;
        return {
          ...rest,
          raised_amount: project.raised_amount || 0,
          banner_url: coverImageUrl,
          featured_image_url: coverImageUrl,
          profiles: profileMap.get(project.user_id),
        };
      });
    }

    // Process profiles
    const profiles: SearchProfile[] = [];
    if (!profilesData.error && profilesData.data) {
      (profilesData.data as RawSearchProfile[]).forEach(profile => {
        profiles.push({
          ...profile,
          name: profile.name,
        });
      });
    }

    return { projects, profiles };
  } catch (error) {
    logger.error('Error getting trending content', error, 'Search');
    return { projects: [], profiles: [] };
  }
}
