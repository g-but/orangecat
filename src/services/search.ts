import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Search interfaces
export interface SearchProfile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface SearchFundingPage {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  tags: string[] | null
  goal_amount: number | null
  total_funding: number
  contributor_count: number
  is_active: boolean
  is_public: boolean
  featured_image_url: string | null
  created_at: string
  slug: string | null
  profiles?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

// Raw type from Supabase (before transformation)
interface RawSearchFundingPage {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  tags: string[] | null
  goal_amount: number | null
  total_funding: number
  contributor_count: number
  is_active: boolean
  is_public: boolean
  featured_image_url: string | null
  created_at: string
  slug: string | null
  profiles: Array<{
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }>
}

export type SearchResult = {
  type: 'profile' | 'campaign'
  data: SearchProfile | SearchFundingPage
  relevanceScore?: number
}

export type SearchType = 'all' | 'profiles' | 'campaigns'
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
    totalCampaigns: number
  }
}

// Cache for search results (simple in-memory cache)
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Generate cache key
function generateCacheKey(options: SearchOptions): string {
  return JSON.stringify({
    query: options.query?.toLowerCase().trim(),
    type: options.type,
    sortBy: options.sortBy,
    filters: options.filters,
    limit: options.limit,
    offset: options.offset
  })
}

// Calculate relevance score
function calculateRelevanceScore(result: SearchResult, query: string): number {
  if (!query) return 0
  
  const lowerQuery = query.toLowerCase()
  let score = 0
  
  if (result.type === 'profile') {
    const profile = result.data as SearchProfile
    
    // Exact username match gets highest score
    if (profile.username?.toLowerCase() === lowerQuery) score += 100
    else if (profile.username?.toLowerCase().includes(lowerQuery)) score += 50
    
    // Display name matches
    if (profile.display_name?.toLowerCase() === lowerQuery) score += 80
    else if (profile.display_name?.toLowerCase().includes(lowerQuery)) score += 40
    
    // Bio matches
    if (profile.bio?.toLowerCase().includes(lowerQuery)) score += 20
    
    // Boost for profiles with avatars (more complete profiles)
    if (profile.avatar_url) score += 5
    
  } else {
    const campaign = result.data as SearchFundingPage
    
    // Title matches get high score
    if (campaign.title.toLowerCase() === lowerQuery) score += 100
    else if (campaign.title.toLowerCase().includes(lowerQuery)) score += 60
    
    // Description matches
    if (campaign.description?.toLowerCase().includes(lowerQuery)) score += 30
    
    // Category matches
    if (campaign.category?.toLowerCase().includes(lowerQuery)) score += 25
    
    // Tag matches
    if (campaign.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) score += 20
    
    // Boost for active campaigns
    if (campaign.is_active) score += 10
    
    // Boost for campaigns with funding
    if (campaign.total_funding > 0) score += 5
    
    // Boost for campaigns with images
    if (campaign.featured_image_url) score += 3
  }
  
  return score
}

// Sort results
function sortResults(results: SearchResult[], sortBy: SortOption, query?: string): SearchResult[] {
  return [...results].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        if (query) {
          const scoreA = a.relevanceScore ?? calculateRelevanceScore(a, query)
          const scoreB = b.relevanceScore ?? calculateRelevanceScore(b, query)
          if (scoreA !== scoreB) return scoreB - scoreA
        }
        // Fall back to recent for same relevance scores
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
        
      case 'recent':
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
        
      case 'popular':
        if (a.type === 'campaign' && b.type === 'campaign') {
          const campaignA = a.data as SearchFundingPage
          const campaignB = b.data as SearchFundingPage
          return campaignB.contributor_count - campaignA.contributor_count
        }
        // Profiles don't have popularity metric, fall back to recent
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
        
      case 'funding':
        if (a.type === 'campaign' && b.type === 'campaign') {
          const campaignA = a.data as SearchFundingPage
          const campaignB = b.data as SearchFundingPage
          return campaignB.total_funding - campaignA.total_funding
        }
        // Profiles don't have funding, fall back to recent
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
        
      default:
        return 0
    }
  })
}

// Search profiles
async function searchProfiles(
  query?: string, 
  limit: number = 20, 
  offset: number = 0
): Promise<SearchProfile[]> {
  let profileQuery = supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, created_at')
  
  if (query) {
    // Use full-text search for better performance on large datasets
    profileQuery = profileQuery.or(
      `username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`
    )
  }
  
  const { data: profiles, error } = await profileQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  return profiles || []
}

// Search funding pages
async function searchFundingPages(
  query?: string,
  filters?: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchFundingPage[]> {
  let campaignQuery = supabase
    .from('funding_pages')
    .select(`
      id, user_id, title, description, category, tags, goal_amount, 
      total_funding, contributor_count, is_active, is_public, 
      featured_image_url, created_at, slug,
      profiles!inner(username, display_name, avatar_url)
    `)
    .eq('is_public', true)
  
  if (query) {
    campaignQuery = campaignQuery.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`
    )
  }
  
  // Apply filters
  if (filters) {
    if (filters.categories && filters.categories.length > 0) {
      campaignQuery = campaignQuery.in('category', filters.categories)
    }
    
    if (filters.isActive !== undefined) {
      campaignQuery = campaignQuery.eq('is_active', filters.isActive)
    }
    
    if (filters.hasGoal) {
      campaignQuery = campaignQuery.not('goal_amount', 'is', null)
    }
    
    if (filters.minFunding !== undefined) {
      campaignQuery = campaignQuery.gte('total_funding', filters.minFunding)
    }
    
    if (filters.maxFunding !== undefined) {
      campaignQuery = campaignQuery.lte('total_funding', filters.maxFunding)
    }
    
    if (filters.dateRange) {
      campaignQuery = campaignQuery
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end)
    }
  }
  
  const { data: rawCampaigns, error } = await campaignQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  // Transform the raw data to match our interface
  const campaigns: SearchFundingPage[] = (rawCampaigns as RawSearchFundingPage[] || []).map(campaign => ({
    ...campaign,
    profiles: campaign.profiles?.[0] || undefined // Take the first profile from the array
  }))
  
  return campaigns
}

// Get search facets for filtering
async function getSearchFacets(): Promise<SearchResponse['facets']> {
  try {
    // Get category counts
    const { data: categoryData, error: categoryError } = await supabase
      .from('funding_pages')
      .select('category')
      .eq('is_public', true)
      .not('category', 'is', null)
    
    if (categoryError) throw categoryError
    
    // Count categories
    const categoryMap = new Map<string, number>()
    categoryData?.forEach(item => {
      if (item.category) {
        categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1)
      }
    })
    
    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    
    // Get total counts
    const [profilesResult, campaignsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('funding_pages').select('id', { count: 'exact', head: true }).eq('is_public', true)
    ])
    
    return {
      categories,
      totalProfiles: profilesResult.count || 0,
      totalCampaigns: campaignsResult.count || 0
    }
  } catch (error) {
    console.error('Error getting search facets:', error)
    return {
      categories: [],
      totalProfiles: 0,
      totalCampaigns: 0
    }
  }
}

// Main search function
export async function search(options: SearchOptions): Promise<SearchResponse> {
  const {
    query,
    type,
    sortBy,
    filters,
    limit = 20,
    offset = 0
  } = options
  
  // Check cache first
  const cacheKey = generateCacheKey(options)
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  try {
    const results: SearchResult[] = []
    let totalCount = 0
    
    // Search profiles
    if (type === 'all' || type === 'profiles') {
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
        console.warn('Error searching profiles:', profileError)
        // Continue with other searches even if profiles fail
      }
    }
    
    // Search campaigns
    if (type === 'all' || type === 'campaigns') {
      try {
        const campaigns = await searchFundingPages(query, filters, limit, offset)
        campaigns.forEach(campaign => {
          const result: SearchResult = { type: 'campaign', data: campaign }
          if (query) {
            result.relevanceScore = calculateRelevanceScore(result, query)
          }
          results.push(result)
        })
      } catch (campaignError) {
        console.warn('Error searching campaigns:', campaignError)
        // Continue even if campaigns fail
      }
    }
    
    // Sort results
    const sortedResults = sortResults(results, sortBy, query)
    
    // Apply pagination after sorting (for mixed results)
    const paginatedResults = sortedResults.slice(offset, offset + limit)
    totalCount = sortedResults.length
    
    // Get facets for filtering UI (make this optional)
    let facets
    try {
      facets = await getSearchFacets()
    } catch (facetError) {
      console.warn('Error getting search facets:', facetError)
      facets = {
        categories: [],
        totalProfiles: 0,
        totalCampaigns: 0
      }
    }
    
    const response: SearchResponse = {
      results: paginatedResults,
      totalCount,
      hasMore: totalCount > offset + limit,
      facets
    }
    
    // Cache the response
    searchCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    })
    
    return response
    
  } catch (error) {
    console.error('Search error:', error)
    // Return empty results instead of throwing
    return {
      results: [],
      totalCount: 0,
      hasMore: false,
      facets: {
        categories: [],
        totalProfiles: 0,
        totalCampaigns: 0
      }
    }
  }
}

// Get trending/popular content
export async function getTrending(): Promise<SearchResponse> {
  try {
    const results: SearchResult[] = []
    
    // Get popular campaigns (by contributor count)
    const { data: rawPopularCampaigns, error: campaignError } = await supabase
      .from('funding_pages')
      .select(`
        id, user_id, title, description, category, tags, goal_amount, 
        total_funding, contributor_count, is_active, is_public, 
        featured_image_url, created_at, slug,
        profiles!inner(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('contributor_count', { ascending: false })
      .limit(10)
    
    // Don't throw error if no campaigns found, just log it
    if (campaignError) {
      console.warn('Error fetching campaigns for trending:', campaignError)
    } else {
      // Transform and add campaigns
      const popularCampaigns: SearchFundingPage[] = (rawPopularCampaigns as RawSearchFundingPage[] || []).map(campaign => ({
        ...campaign,
        profiles: campaign.profiles?.[0] || undefined
      }))
      
      popularCampaigns.forEach(campaign => {
        results.push({ type: 'campaign', data: campaign })
      })
    }
    
    // Get recent profiles
    const { data: recentProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10) // Increased limit and removed avatar filter to get more results
    
    // Don't throw error if no profiles found, just log it
    if (profileError) {
      console.warn('Error fetching profiles for trending:', profileError)
    } else {
      recentProfiles?.forEach(profile => {
        results.push({ type: 'profile', data: profile })
      })
    }
    
    // If we have no results at all, that's when we should indicate empty state
    return {
      results,
      totalCount: results.length,
      hasMore: false
    }
    
  } catch (error) {
    console.error('Error getting trending content:', error)
    // Return empty results instead of throwing, let the UI handle empty state
    return {
      results: [],
      totalCount: 0,
      hasMore: false
    }
  }
}

// Clear search cache (useful for admin or when data changes)
export function clearSearchCache(): void {
  searchCache.clear()
}

// Get search suggestions (for autocomplete)
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query || query.length < 2) return []
  
  try {
    const suggestions = new Set<string>()
    
    // Get username suggestions
    const { data: profiles } = await supabase
      .from('profiles')
      .select('username, display_name')
      .or(`username.ilike.${query}%,display_name.ilike.${query}%`)
      .limit(limit)
    
    profiles?.forEach(profile => {
      if (profile.username?.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(profile.username)
      }
      if (profile.display_name?.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(profile.display_name)
      }
    })
    
    // Get campaign title suggestions
    const { data: campaigns } = await supabase
      .from('funding_pages')
      .select('title, category')
      .eq('is_public', true)
      .or(`title.ilike.${query}%,category.ilike.${query}%`)
      .limit(limit)
    
    campaigns?.forEach(campaign => {
      if (campaign.title.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(campaign.title)
      }
      if (campaign.category?.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(campaign.category)
      }
    })
    
    return Array.from(suggestions).slice(0, limit)
    
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return []
  }
} 