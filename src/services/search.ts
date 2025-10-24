import supabase from '@/lib/supabase/browser'
import { logger } from '@/utils/logger'

// Search interfaces
export interface SearchProfile {
  id: string
  username: string | null
  name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface SearchFundingPage {
  id: string
  user_id: string
  title: string
  description: string
  bitcoin_address: string
  is_verified: boolean
  verification_level: number
  is_public: boolean
  created_at: string
  updated_at: string
  profiles?: {
    username: string | null
    name: string | null
    avatar_url: string | null
  }
}

// Raw type from Supabase (before transformation)
interface RawSearchFundingPage {
  id: string
  user_id: string
  title: string
  description: string
  bitcoin_address: string
  is_verified: boolean
  verification_level: number
  is_public: boolean
  created_at: string
  updated_at: string
  profiles: Array<{
    username: string | null
    name: string | null
    avatar_url: string | null
  }>
}

export type SearchResult = {
  type: 'profile' | 'project'
  data: SearchProfile | SearchFundingPage
  relevanceScore?: number
}

export type SearchType = 'all' | 'profiles' | 'projects'
export type SortOption = 'relevance' | 'recent' | 'popular' | 'funding'

export interface SearchFilters {
  categories?: string[]
  isActive?: boolean
  hasGoal?: boolean
  minFunding?: number
  maxFunding?: number
  dateRange?: {
    start: string
    end: string
  }
}

export interface SearchOptions {
  query?: string
  type: SearchType
  sortBy: SortOption
  filters?: SearchFilters
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  hasMore: boolean
  facets?: {
    categories: Array<{ name: string; count: number }>
    totalProfiles: number
    totalProjects: number
  }
}

// ==================== PERFORMANCE OPTIMIZATIONS ====================

// Enhanced cache with better performance characteristics
interface CacheEntry {
  data: SearchResponse
  timestamp: number
  hitCount: number
  size: number
}

const searchCache = new Map<string, CacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100 // Maximum number of cached entries
const MAX_CACHE_MEMORY = 10 * 1024 * 1024 // 10MB max cache size

// Cache cleanup for memory management
function cleanupCache(): void {
  if (searchCache.size <= MAX_CACHE_SIZE) {return}
  
  // Remove oldest entries
  const entries = Array.from(searchCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
  
  // Remove oldest 20% of entries
  const toRemove = Math.floor(entries.length * 0.2)
  for (let i = 0; i < toRemove; i++) {
    searchCache.delete(entries[i][0])
  }
}

// Generate optimized cache key with shorter hash for better performance
function generateCacheKey(options: SearchOptions): string {
  const keyData = {
    q: options.query?.toLowerCase().trim(),
    t: options.type,
    s: options.sortBy,
    f: options.filters,
    l: options.limit,
    o: options.offset
  }
  return JSON.stringify(keyData)
}

// Enhanced cache with hit tracking
function getCachedResult(key: string): SearchResponse | null {
  const cached = searchCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // Update hit count for cache analytics
    cached.hitCount++
    return cached.data
  }
  
  // Remove expired entry
  if (cached) {
    searchCache.delete(key)
  }
  
  return null
}

// Enhanced cache storage with size tracking
function setCachedResult(key: string, data: SearchResponse): void {
  const size = JSON.stringify(data).length
  
  searchCache.set(key, {
    data,
    timestamp: Date.now(),
    hitCount: 0,
    size
  })
  
  cleanupCache()
}

// ==================== OPTIMIZED DATABASE QUERIES ====================

// Calculate relevance score (moved up for better optimization)
function calculateRelevanceScore(result: SearchResult, query: string): number {
  if (!query) {return 0}

  const lowerQuery = query.toLowerCase()
  let score = 0

  if (result.type === 'profile') {
    const profile = result.data as SearchProfile

    // Exact username match gets highest score
    if (profile.username?.toLowerCase() === lowerQuery) {score += 100}
    else if (profile.username?.toLowerCase().includes(lowerQuery)) {score += 50}

    // Display name matches
    if (profile.name?.toLowerCase() === lowerQuery) {score += 80}
    else if (profile.name?.toLowerCase().includes(lowerQuery)) {score += 40}

    // Bio matches
    if (profile.bio?.toLowerCase().includes(lowerQuery)) {score += 20}

    // Boost for profiles with avatars (more complete profiles)
    if (profile.avatar_url) {score += 5}

  } else {
    const project = result.data as SearchFundingPage

    // Title matches get high score
    if (project.title.toLowerCase() === lowerQuery) {score += 100}
    else if (project.title.toLowerCase().includes(lowerQuery)) {score += 60}

    // Description matches
    if (project.description?.toLowerCase().includes(lowerQuery)) {score += 30}

    // Bitcoin address matches (for technical searches)
    if (project.bitcoin_address?.toLowerCase().includes(lowerQuery)) {score += 15}

    // Boost for verified projects
    if (project.is_verified) {score += 10}

    // Boost for projects with higher verification level
    score += project.verification_level * 2
  }

  return score
}

// Optimized profile search with better indexing usage
async function searchProfiles(
  query?: string, 
  limit: number = 20, 
  offset: number = 0
): Promise<SearchProfile[]> {
  // Start with minimal columns for better performance
  let profileQuery = supabase
    .from('profiles')
    .select('id, username, name, bio, avatar_url, created_at')
  
  if (query) {
    // OPTIMIZATION: Use tsvector for full-text search when available
    // For now, optimize ILIKE queries with proper ordering
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&') // Escape SQL wildcards
    profileQuery = profileQuery.or(
      `username.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%,bio.ilike.%${sanitizedQuery}%`
    )
  }
  
  // OPTIMIZATION: Use created_at index for better performance
  const { data: profiles, error } = await profileQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {throw error}
  return profiles || []
}

// Optimized project search with better query structure
async function searchFundingPages(
  query?: string,
  filters?: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchFundingPage[]> {
  // OPTIMIZATION: Only select necessary columns to reduce payload
  let projectQuery = supabase
    .from('projects')
    .select(`
      id, user_id, title, description, bitcoin_address, is_verified,
      verification_level, is_public, created_at, updated_at,
      profiles!inner(username, name, avatar_url)
    `)
    .eq('is_public', true) // OPTIMIZATION: This should use an index

  if (query) {
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&')
    projectQuery = projectQuery.or(
      `title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
    )
  }

  // OPTIMIZATION: Apply most selective filters first
  if (filters) {
    // Most selective filters first for better query performance
    if (filters.isActive !== undefined) {
      // Note: is_active doesn't exist in current schema, using is_verified as proxy
      projectQuery = projectQuery.eq('is_verified', filters.isActive)
    }

    if (filters.categories && filters.categories.length > 0) {
      // Note: category doesn't exist in current schema, skipping for now
      // projectQuery = projectQuery.in('category', filters.categories)
    }

    if (filters.hasGoal) {
      // Note: goal_amount doesn't exist in current schema
      // projectQuery = projectQuery.not('goal_amount', 'is', null)
    }

    if (filters.minFunding !== undefined) {
      // Note: total_funding doesn't exist in current schema
      // projectQuery = projectQuery.gte('total_funding', filters.minFunding)
    }

    if (filters.maxFunding !== undefined) {
      // Note: total_funding doesn't exist in current schema
      // projectQuery = projectQuery.lte('total_funding', filters.maxFunding)
    }

    if (filters.dateRange) {
      projectQuery = projectQuery
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end)
    }
  }

  // OPTIMIZATION: Use index-friendly ordering
  const { data: rawProjects, error } = await projectQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {throw error}

  // OPTIMIZATION: Minimize data transformation overhead
  const projects: SearchFundingPage[] = (rawProjects as RawSearchFundingPage[] || []).map(project => ({
    ...project,
    profiles: project.profiles?.[0] || undefined
  }))

  return projects
}

// OPTIMIZATION: Cached facets with smarter update strategy
let facetsCache: { data: SearchResponse['facets']; timestamp: number } | null = null
const FACETS_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for facets

async function getSearchFacets(): Promise<SearchResponse['facets']> {
  // Return cached facets if available
  if (facetsCache && Date.now() - facetsCache.timestamp < FACETS_CACHE_DURATION) {
    return facetsCache.data
  }

  try {
    // OPTIMIZATION: Use Promise.all for parallel queries
    const [profilesResult, projectsResult] = await Promise.all([
      // Use count queries with head:true for better performance
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_public', true)
    ])

    const facets = {
      categories: [], // Categories don't exist in current schema
      totalProfiles: profilesResult.count || 0,
      totalProjects: projectsResult.count || 0
    }

    // Cache the facets
    facetsCache = {
      data: facets,
      timestamp: Date.now()
    }

    return facets
  } catch (error) {
    logger.error('Error getting search facets', error, 'Search')
    return {
      categories: [],
      totalProfiles: 0,
      totalProjects: 0
    }
  }
}

// Sort results (optimized for performance)
function sortResults(results: SearchResult[], sortBy: SortOption, query?: string): SearchResult[] {
  // OPTIMIZATION: Avoid array copying when possible
  if (results.length <= 1) {return results}

  return [...results].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        if (query) {
          const scoreA = a.relevanceScore ?? calculateRelevanceScore(a, query)
          const scoreB = b.relevanceScore ?? calculateRelevanceScore(b, query)
          if (scoreA !== scoreB) {return scoreB - scoreA}
        }
        // Fall back to recent for same relevance scores
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()

      case 'recent':
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()

      case 'popular':
        // Note: contributor_count doesn't exist in current schema, fall back to recent
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()

      case 'funding':
        // Note: total_funding doesn't exist in current schema, fall back to recent
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()

      default:
        return 0
    }
  })
}

// OPTIMIZATION: Main search function with improved performance
export async function search(options: SearchOptions): Promise<SearchResponse> {
  const {
    query,
    type,
    sortBy,
    filters,
    limit = 20,
    offset = 0
  } = options

  // Check cache first with optimized cache key
  const cacheKey = generateCacheKey(options)
  const cachedResult = getCachedResult(cacheKey)
  if (cachedResult) {
    return cachedResult
  }

  try {
    const results: SearchResult[] = []
    let totalCount = 0

    // OPTIMIZATION: Use Promise.all for parallel searches when type is 'all'
    if (type === 'all') {
      const [profiles, projects] = await Promise.all([
        searchProfiles(query, limit, offset).catch(error => {
          logger.warn('Error searching profiles', error, 'Search')
          return []
        }),
        searchFundingPages(query, filters, limit, offset).catch(error => {
          logger.warn('Error searching projects', error, 'Search')
          return []
        })
      ])

      // Process profiles
      profiles.forEach(profile => {
        const result: SearchResult = { type: 'profile', data: profile }
        if (query) {
          result.relevanceScore = calculateRelevanceScore(result, query)
        }
        results.push(result)
      })

      // Process projects
      projects.forEach(project => {
        const result: SearchResult = { type: 'project', data: project }
        if (query) {
          result.relevanceScore = calculateRelevanceScore(result, query)
        }
        results.push(result)
      })
    } else {
      // Single type searches
      if (type === 'profiles') {
        try {
          const profiles = await searchProfiles(query, limit, offset)
          profiles.forEach(profile => {
            const result: SearchResult = { type: 'profile', data: profile }
            if (query) {
              result.relevanceScore = calculateRelevanceScore(result, query)
            }
            results.push(result)
          })
        } catch (profileError) {
          logger.warn('Error searching profiles', profileError, 'Search')
        }
      }

      if (type === 'projects') {
        try {
          const projects = await searchFundingPages(query, filters, limit, offset)
          projects.forEach(project => {
            const result: SearchResult = { type: 'project', data: project }
            if (query) {
              result.relevanceScore = calculateRelevanceScore(result, query)
            }
            results.push(result)
          })
        } catch (projectError) {
          logger.warn('Error searching projects', projectError, 'Search')
        }
      }
    }

    // Sort results
    const sortedResults = sortResults(results, sortBy, query)

    // Apply pagination after sorting (for mixed results)
    const paginatedResults = sortedResults.slice(offset, offset + limit)
    totalCount = sortedResults.length

    // Get facets only if needed (not for every search)
    let facets: SearchResponse['facets'] | undefined
    if (type === 'all' || type === 'projects') {
      try {
        facets = await getSearchFacets()
      } catch (facetsError) {
        logger.warn('Error getting facets', facetsError, 'Search')
      }
    }

    const response: SearchResponse = {
      results: paginatedResults,
      totalCount,
      hasMore: totalCount > offset + limit,
      facets
    }

    // Cache the result
    setCachedResult(cacheKey, response)

    return response
  } catch (error) {
    logger.error('Search error', error, 'Search')

    // Return empty results on error
    const errorResponse: SearchResponse = {
      results: [],
      totalCount: 0,
      hasMore: false
    }

    return errorResponse
  }
}

// ==================== REMAINING FUNCTIONS (OPTIMIZED) ====================

// Optimized trending function with better performance
export async function getTrending(): Promise<SearchResponse> {
  try {
    const results: SearchResult[] = []

    // OPTIMIZATION: Use Promise.all for parallel queries
    const [projectsData, profilesData] = await Promise.all([
      // Get recent projects (since we don't have contributor_count)
      supabase
      .from('projects')
      .select(`
        id, user_id, title, description, bitcoin_address, is_verified,
        verification_level, is_public, created_at, updated_at,
        profiles!inner(username, name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10),

      // Get recent profiles
      supabase
        .from('profiles')
        .select('id, username, name, bio, avatar_url, created_at')
        .order('created_at', { ascending: false })
      .limit(10)
    ])

    // Process projects
    if (!projectsData.error && projectsData.data) {
      const recentProjects: SearchFundingPage[] = (projectsData.data as RawSearchFundingPage[]).map(project => ({
        ...project,
        profiles: project.profiles?.[0] || undefined
      }))

      recentProjects.forEach(project => {
        results.push({ type: 'project', data: project })
      })
    } else if (projectsData.error) {
      logger.warn('Error fetching projects for trending', { error: projectsData.error.message }, 'Search')
    }

    // Process profiles
    if (!profilesData.error && profilesData.data) {
      profilesData.data.forEach(profile => {
        results.push({ type: 'profile', data: profile })
      })
    } else if (profilesData.error) {
      logger.warn('Error fetching profiles for trending', { error: profilesData.error.message }, 'Search')
    }

    return {
      results,
      totalCount: results.length,
      hasMore: false // Trending is always a fixed set
    }
  } catch (error) {
    logger.error('Error getting trending content', error, 'Search')
    return {
      results: [],
      totalCount: 0,
      hasMore: false
    }
  }
}

// Clear cache with cleanup
export function clearSearchCache(): void {
  searchCache.clear()
  facetsCache = null
}

// Optimized search suggestions
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query || query.length < 2) {return []}
  
  try {
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&')
    
    // OPTIMIZATION: Use Promise.all for parallel suggestion queries
    const [profileSuggestions, projectSuggestions] = await Promise.all([
      supabase
      .from('profiles')
      .select('username, name')
        .or(`username.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%`)
        .not('username', 'is', null)
        .limit(limit),
      
      supabase
      .from('projects')
      .select('title, category')
        .or(`title.ilike.%${sanitizedQuery}%,category.ilike.%${sanitizedQuery}%`)
      .eq('is_public', true)
      .limit(limit)
    ])
    
    const suggestions: Set<string> = new Set()
    
    // Add profile suggestions
    if (!profileSuggestions.error && profileSuggestions.data) {
      profileSuggestions.data.forEach(profile => {
        if (profile.username) {suggestions.add(profile.username)}
        if (profile.name) {suggestions.add(profile.name)}
      })
    }
    
    // Add project suggestions
    if (!projectSuggestions.error && projectSuggestions.data) {
      projectSuggestions.data.forEach(project => {
        if (project.title) {suggestions.add(project.title)}
        if (project.category) {suggestions.add(project.category)}
      })
    }
    
    return Array.from(suggestions).slice(0, limit)
  } catch (error) {
    logger.error('Error getting search suggestions', error, 'Search')
    return []
  }
} 