/**
 * Search Suggestions Queries
 *
 * Provides type-ahead / autocomplete suggestions from profiles and projects.
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { PUBLIC_SEARCH_STATUSES } from '@/config/project-statuses';
import { getTableName } from '@/config/entity-registry';
import { sanitizeQuery } from './helpers';

/**
 * Get search suggestions from database
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const sanitized = sanitizeQuery(query);

    // Use Promise.all for parallel suggestion queries
    const [profileSuggestions, projectSuggestions] = await Promise.all([
      supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('username, name')
        .or(`username.ilike.%${sanitized}%,name.ilike.%${sanitized}%`)
        .not('username', 'is', null)
        .limit(limit),

      supabase
        .from(getTableName('project'))
        .select('title, category')
        .or(`title.ilike.%${sanitized}%,category.ilike.%${sanitized}%`)
        .in('status', PUBLIC_SEARCH_STATUSES as string[])
        .limit(limit),
    ]);

    const suggestions: Set<string> = new Set();

    // Add profile suggestions
    if (!profileSuggestions.error && profileSuggestions.data) {
      (profileSuggestions.data as Array<{ username?: string; name?: string }>).forEach(profile => {
        if (profile.username) {
          suggestions.add(profile.username);
        }
        if (profile.name) {
          suggestions.add(profile.name);
        }
      });
    }

    // Add project suggestions
    if (!projectSuggestions.error && projectSuggestions.data) {
      (projectSuggestions.data as Array<{ title?: string; category?: string }>).forEach(project => {
        if (project.title) {
          suggestions.add(project.title);
        }
        if (project.category) {
          suggestions.add(project.category);
        }
      });
    }

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    logger.error('Error getting search suggestions', error, 'Search');
    return [];
  }
}
