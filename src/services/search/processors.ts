/**
 * Search Result Processors
 *
 * Handles relevance scoring, sorting, and facet generation for search results.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted from search.ts for better modularity
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { PUBLIC_SEARCH_STATUSES } from '@/config/project-statuses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getTableName } from '@/config/entity-registry';
import type {
  SearchResult,
  SearchProfile,
  SearchFundingPage,
  SearchLoan,
  SortOption,
  SearchResponse,
} from './types';

// ==================== RELEVANCE SCORING ====================

/**
 * Calculate relevance score for a search result
 */
export function calculateRelevanceScore(result: SearchResult, query: string): number {
  if (!query) {
    return 0;
  }

  const lowerQuery = query.toLowerCase();
  let score = 0;

  if (result.type === 'profile') {
    const profile = result.data as SearchProfile;

    // Exact username match gets highest score
    if (profile.username?.toLowerCase() === lowerQuery) {
      score += 100;
    } else if (profile.username?.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }

    // Display name matches
    if (profile.name?.toLowerCase() === lowerQuery) {
      score += 80;
    } else if (profile.name?.toLowerCase().includes(lowerQuery)) {
      score += 40;
    }

    // Bio matches
    if (profile.bio?.toLowerCase().includes(lowerQuery)) {
      score += 20;
    }

    // Boost for profiles with avatars (more complete profiles)
    if (profile.avatar_url) {
      score += 5;
    }
  } else if (result.type === 'loan') {
    const loan = result.data as SearchLoan;

    // Title matches get high score
    if (loan.title.toLowerCase() === lowerQuery) {
      score += 100;
    } else if (loan.title.toLowerCase().includes(lowerQuery)) {
      score += 60;
    }

    // Description matches
    if (loan.description?.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }

    // Boost for loans with negotiable terms
    if (loan.is_negotiable) {
      score += 5;
    }

    // Boost for loans with interest rates (more complete listings)
    if (loan.interest_rate) {
      score += 5;
    }
  } else {
    const project = result.data as SearchFundingPage;

    // Title matches get high score
    if (project.title.toLowerCase() === lowerQuery) {
      score += 100;
    } else if (project.title.toLowerCase().includes(lowerQuery)) {
      score += 60;
    }

    // Description matches
    if (project.description?.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }

    // Bitcoin address matches (for technical searches)
    if (project.bitcoin_address?.toLowerCase().includes(lowerQuery)) {
      score += 15;
    }

    // Boost for projects with funding goals
    if (project.goal_amount) {
      score += 5;
    }

    // Boost for projects that have raised funds
    if ((project.raised_amount || 0) > 0) {
      score += 10;
    }
  }

  return score;
}

// ==================== SORTING ====================

/**
 * Sort results based on sort option
 */
export function sortResults(
  results: SearchResult[],
  sortBy: SortOption,
  query?: string
): SearchResult[] {
  // OPTIMIZATION: Avoid array copying when possible
  if (results.length <= 1) {
    return results;
  }

  return [...results].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        if (query) {
          const scoreA = a.relevanceScore ?? calculateRelevanceScore(a, query);
          const scoreB = b.relevanceScore ?? calculateRelevanceScore(b, query);
          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
        }
        // Fall back to recent for same relevance scores
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();

      case 'recent':
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();

      // Note: 'popular' and 'funding' sort options removed - not implemented in schema
      // If needed in future, add engagement metrics tracking first

      default:
        return 0;
    }
  });
}

// ==================== FACETS ====================

// OPTIMIZATION: Cached facets with smarter update strategy
let facetsCache: { data: SearchResponse['facets']; timestamp: number } | null = null;
const FACETS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for facets

/**
 * Get search facets (categories, totals, etc.)
 */
export async function getSearchFacets(): Promise<SearchResponse['facets']> {
  // Return cached facets if available
  if (facetsCache && Date.now() - facetsCache.timestamp < FACETS_CACHE_DURATION) {
    return facetsCache.data;
  }

  try {
    // OPTIMIZATION: Use Promise.all for parallel queries
    const [profilesResult, projectsResult, loansResult] = await Promise.all([
      // Use count queries with head:true for better performance
      supabase.from(DATABASE_TABLES.PROFILES).select('id', { count: 'exact', head: true }),
      supabase
        .from(getTableName('project'))
        .select('id', { count: 'exact', head: true })
        .in('status', PUBLIC_SEARCH_STATUSES as string[]),
      supabase
        .from(getTableName('loan'))
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true)
        .eq('status', 'active'),
    ]);

    const facets = {
      categories: [], // Categories don't exist in current schema
      totalProfiles: profilesResult.count || 0,
      totalProjects: projectsResult.count || 0,
      totalLoans: loansResult.count || 0,
    };

    // Cache the facets
    facetsCache = {
      data: facets,
      timestamp: Date.now(),
    };

    return facets;
  } catch (error) {
    logger.error('Error getting search facets', error, 'Search');
    return {
      categories: [],
      totalProfiles: 0,
      totalProjects: 0,
      totalLoans: 0,
    };
  }
}

/**
 * Clear facets cache
 */
export function clearFacetsCache(): void {
  facetsCache = null;
}
