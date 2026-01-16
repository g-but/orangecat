/**
 * Search Cache Management
 *
 * Handles caching of search results for performance optimization.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted from search.ts for better modularity
 */

import type { SearchOptions, SearchResponse } from './types';

// ==================== CACHE TYPES ====================

interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
  hitCount: number;
  size: number;
}

// ==================== CACHE CONFIGURATION ====================

const searchCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries
const _MAX_CACHE_MEMORY = 10 * 1024 * 1024; // 10MB max cache size

// ==================== CACHE UTILITIES ====================

/**
 * Clean up cache for memory management
 */
function cleanupCache(): void {
  if (searchCache.size <= MAX_CACHE_SIZE) {
    return;
  }

  // Remove oldest entries
  const entries = Array.from(searchCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);

  // Remove oldest 20% of entries
  const toRemove = Math.floor(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    searchCache.delete(entries[i][0]);
  }
}

/**
 * Generate optimized cache key with shorter hash for better performance
 */
export function generateCacheKey(options: SearchOptions): string {
  const keyData = {
    q: options.query?.toLowerCase().trim(),
    t: options.type,
    s: options.sortBy,
    f: options.filters,
    l: options.limit,
    o: options.offset,
  };
  return JSON.stringify(keyData);
}

/**
 * Get cached result with hit tracking
 */
export function getCachedResult(key: string): SearchResponse | null {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // Update hit count for cache analytics
    cached.hitCount++;
    return cached.data;
  }

  // Remove expired entry
  if (cached) {
    searchCache.delete(key);
  }

  return null;
}

/**
 * Store result in cache with size tracking
 */
export function setCachedResult(key: string, data: SearchResponse): void {
  const size = JSON.stringify(data).length;

  searchCache.set(key, {
    data,
    timestamp: Date.now(),
    hitCount: 0,
    size,
  });

  cleanupCache();
}

/**
 * Clear all cached search results
 */
export function clearSearchCache(): void {
  searchCache.clear();
}



