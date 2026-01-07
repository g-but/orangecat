/**
 * Search Service - Main Entry Point
 *
 * Orchestrates search operations using modular architecture.
 * This file serves as the main export point for backwards compatibility.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Refactored from 919-line monolith to modular architecture (~200 lines)
 */

import { logger } from '@/utils/logger';
import { generateCacheKey, getCachedResult, setCachedResult, clearSearchCache } from './search/cache';
import { calculateRelevanceScore, sortResults, getSearchFacets, clearFacetsCache } from './search/processors';
import { searchProfiles, searchFundingPages, searchLoans, getSearchSuggestions, getTrending as getTrendingData } from './search/queries';

// Re-export all types from types module
export type {
  SearchResult,
  SearchType,
  SortOption,
  SearchFilters,
  SearchOptions,
  SearchResponse,
  SearchProfile,
  SearchFundingPage,
  SearchLoan,
} from './search/types';

// Import types for internal use
import type {
  SearchResult,
  SearchType,
  SortOption,
  SearchFilters,
  SearchOptions,
  SearchResponse,
  SearchProfile,
  SearchFundingPage,
  SearchLoan,
} from './search/types';

/**
 * Main search function - orchestrates all search operations
 */
export async function search(options: SearchOptions): Promise<SearchResponse> {
  const { query, type, sortBy, filters, limit = 20, offset = 0 } = options;

  // Check cache first
  const cacheKey = generateCacheKey(options);
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  try {
    const results: SearchResult[] = [];
    let totalCount = 0;

    // Use Promise.all for parallel searches when type is 'all'
    if (type === 'all') {
      const [profiles, projects, loans] = await Promise.all([
        searchProfiles(query, filters, limit, offset).catch(error => {
          logger.warn('Error searching profiles', error, 'Search');
          return [];
        }),
        searchFundingPages(query, filters, limit, offset).catch(error => {
          logger.warn('Error searching projects', error, 'Search');
          return [];
        }),
        searchLoans(query, filters, limit, offset).catch(error => {
          logger.warn('Error searching loans', error, 'Search');
          return [];
        }),
      ]);

      // Process profiles
      profiles.forEach(profile => {
        const result: SearchResult = { type: 'profile', data: profile };
        if (query) {
          result.relevanceScore = calculateRelevanceScore(result, query);
        }
        results.push(result);
      });

      // Process projects
      projects.forEach(project => {
        const result: SearchResult = { type: 'project', data: project };
        if (query) {
          result.relevanceScore = calculateRelevanceScore(result, query);
        }
        results.push(result);
      });

      // Process loans
      loans.forEach(loan => {
        const result: SearchResult = { type: 'loan', data: loan };
        if (query) {
          result.relevanceScore = calculateRelevanceScore(result, query);
        }
        results.push(result);
      });
    } else {
      // Single type searches
      if (type === 'profiles') {
        try {
          const profiles = await searchProfiles(query, filters, limit, offset);
          profiles.forEach(profile => {
            const result: SearchResult = { type: 'profile', data: profile };
            if (query) {
              result.relevanceScore = calculateRelevanceScore(result, query);
            }
            results.push(result);
          });
        } catch (profileError) {
          logger.warn('Error searching profiles', profileError, 'Search');
        }
      }

      if (type === 'projects') {
        try {
          const projects = await searchFundingPages(query, filters, limit, offset);
          projects.forEach(project => {
            const result: SearchResult = { type: 'project', data: project };
            if (query) {
              result.relevanceScore = calculateRelevanceScore(result, query);
            }
            results.push(result);
          });
        } catch (projectError) {
          logger.warn('Error searching projects', projectError, 'Search');
        }
      }

      if (type === 'loans') {
        try {
          const loans = await searchLoans(query, filters, limit, offset);
          loans.forEach(loan => {
            const result: SearchResult = { type: 'loan', data: loan };
            if (query) {
              result.relevanceScore = calculateRelevanceScore(result, query);
            }
            results.push(result);
          });
        } catch (loanError) {
          logger.warn('Error searching loans', loanError, 'Search');
        }
      }
    }

    // Sort results
    const sortedResults = sortResults(results, sortBy, query);

    // Apply pagination after sorting (for mixed results)
    const paginatedResults = sortedResults.slice(offset, offset + limit);
    totalCount = sortedResults.length;

    // Get facets only if needed
    let facets: SearchResponse['facets'] | undefined;
    if (type === 'all' || type === 'projects') {
      try {
        facets = await getSearchFacets();
      } catch (facetsError) {
        logger.warn('Error getting facets', facetsError, 'Search');
      }
    }

    const response: SearchResponse = {
      results: paginatedResults,
      totalCount,
      hasMore: totalCount > offset + limit,
      facets,
    };

    // Cache the result
    setCachedResult(cacheKey, response);

    return response;
  } catch (error) {
    logger.error('Search error', error, 'Search');

    // Return empty results on error
    return {
      results: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Get trending content
 */
export async function getTrending(): Promise<SearchResponse> {
  try {
    const results: SearchResult[] = [];
    const { projects, profiles } = await getTrendingData();

    // Process projects
    projects.forEach(project => {
      results.push({ type: 'project', data: project });
    });

    // Process profiles
    profiles.forEach(profile => {
      results.push({ type: 'profile', data: profile });
    });

    return {
      results,
      totalCount: results.length,
      hasMore: false, // Trending is always a fixed set
    };
  } catch (error) {
    logger.error('Error getting trending content', error, 'Search');
    return {
      results: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

// Re-export utility functions
export { getSearchSuggestions };

/**
 * Clear all search caches
 */
export function clearAllSearchCaches(): void {
  clearSearchCache();
  clearFacetsCache();
}
