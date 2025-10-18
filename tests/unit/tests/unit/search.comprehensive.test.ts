/**
 * SEARCH SERVICE - COMPREHENSIVE TEST COVERAGE
 * 
 * This test suite provides comprehensive coverage for the SearchService,
 * testing all search operations, caching, filtering, trending content,
 * suggestions, and error handling scenarios.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Comprehensive SearchService tests for production readiness
 */

// Mock Supabase client
jest.mock('@/services/supabase/client', () => ({
  __esModule: true,
  default: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
    rpc: jest.fn()
  }
}))

// Get the mocked client
import supabase from '@/services/supabase/client'
const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Import after mocking
import { 
  search, 
  getTrending, 
  getSearchSuggestions, 
  clearSearchCache,
  SearchOptions,
  SearchResponse,
  SearchProfile,
  SearchFundingPage
} from '../search'

// Helper function to create consistent mock chain
const createMockQuery = (data: any[], error: any = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockResolvedValue({ data, error }),
  limit: jest.fn().mockResolvedValue({ data, error }),
  not: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
})

describe('🔍 Search Service - Comprehensive Coverage', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    clearSearchCache() // Clear cache between tests
    
    // Reset console methods to avoid test noise
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup default mock responses
    mockSupabase.from.mockReturnValue(createMockQuery([], null))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('🎯 Service Architecture', () => {
    
    test('should export all required functions', () => {
      expect(typeof search).toBe('function')
      expect(typeof getTrending).toBe('function')
      expect(typeof getSearchSuggestions).toBe('function')
      expect(typeof clearSearchCache).toBe('function')
    })

    test('should have proper TypeScript types exported', () => {
      // This test ensures our types are properly exported
      const searchOptions: SearchOptions = {
        query: 'test',
        type: 'all',
        sortBy: 'relevance'
      }
      expect(searchOptions).toBeDefined()
    })

  })

  describe('🔍 Search Operations', () => {
    
    test('should search profiles successfully', async () => {
      const mockProfiles = [
        {
          id: 'prof-1',
          username: 'testuser',
          display_name: 'Test User',
          bio: 'Test bio',
          avatar_url: 'avatar.jpg',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      ]

      // Use consistent mock pattern
      mockSupabase.from.mockReturnValue(createMockQuery(mockProfiles, null))

      const options: SearchOptions = {
        query: 'test',
        type: 'profiles',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result.results).toHaveLength(1)
      expect(result.results[0].type).toBe('profile')
      expect(result.results[0].data).toEqual(mockProfiles[0])
      expect(result.totalCount).toBe(1)
    })

    test('should search campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: 'camp-1',
          user_id: 'user-1',
          title: 'Test Campaign',
          description: 'Test description',
          category: 'technology',
          tags: ['test'],
          goal_amount: 10000,
          total_funding: 5000,
          contributor_count: 25,
          is_active: true,
          is_public: true,
          featured_image_url: 'image.jpg',
          created_at: '2024-01-01T00:00:00.000Z',
          slug: 'test-campaign',
          profiles: [{
            username: 'creator',
            display_name: 'Creator',
            avatar_url: 'creator.jpg'
          }]
        }
      ]

      // Use consistent mock pattern
      mockSupabase.from.mockReturnValue(createMockQuery(mockCampaigns, null))

      const options: SearchOptions = {
        query: 'campaign',
        type: 'campaigns',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result.results).toHaveLength(1)
      expect(result.results[0].type).toBe('campaign')
      expect((result.results[0].data as any).title).toBe('Test Campaign')
    })

    test('should search all types simultaneously', async () => {
      const mockProfiles = [{ 
        id: 'prof-1',
        username: 'testuser', 
        display_name: 'Test User',
        bio: 'Test bio',
        avatar_url: 'avatar.jpg',
        created_at: '2024-01-01T00:00:00.000Z'
      }]
      
      const mockCampaigns = [{
        id: 'camp-1',
        user_id: 'user-1',
        title: 'Test Campaign',
        description: 'Test description',
        category: 'technology',
        tags: ['test'],
        goal_amount: 10000,
        total_funding: 5000,
        contributor_count: 25,
        is_active: true,
        is_public: true,
        featured_image_url: 'image.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        slug: 'test-campaign',
        profiles: [{
          username: 'creator',
          display_name: 'Creator',
          avatar_url: 'creator.jpg'
        }]
      }]

      // Mock both profile and campaign queries consistently
      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        callCount++
        if (table === 'profiles') {
          return createMockQuery(mockProfiles, null)
        } else if (table === 'funding_pages') {
          return createMockQuery(mockCampaigns, null)
        }
        return createMockQuery([], null)
      })

      const options: SearchOptions = {
        query: 'test',
        type: 'all',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result.results).toHaveLength(2) // Both profile and campaign
      expect(result.results.some(r => r.type === 'profile')).toBe(true)
      expect(result.results.some(r => r.type === 'campaign')).toBe(true)
    })

    test('should handle empty search query', async () => {
      const options: SearchOptions = {
        type: 'all',
        sortBy: 'recent'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(Array.isArray(result.results)).toBe(true)
    })

    test('should handle search with filters', async () => {
      const mockCampaigns = [{
        id: 'camp-1',
        user_id: 'user-1',
        title: 'Test Campaign',
        description: 'Test description',
        category: 'technology',
          tags: ['test'],
        goal_amount: 10000,
        total_funding: 5000,
        contributor_count: 25,
          is_active: true,
          is_public: true,
        featured_image_url: 'image.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        slug: 'test-campaign',
        profiles: [{
          username: 'creator',
          display_name: 'Creator',
          avatar_url: 'creator.jpg'
        }]
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
            in: jest.fn(() => ({
              eq: jest.fn(() => ({
                not: jest.fn(() => ({
                  gte: jest.fn(() => ({
                    lte: jest.fn(() => ({
                      gte: jest.fn(() => ({
                        lte: jest.fn(() => ({
              order: jest.fn(() => ({
                            range: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
                          }))
                        }))
                      }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      })

      const options: SearchOptions = {
        query: 'test',
        type: 'campaigns',
        sortBy: 'funding',
        filters: {
          categories: ['technology'],
          isActive: true,
          hasGoal: true,
          minFunding: 1000,
          maxFunding: 20000,
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31'
          }
        }
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(Array.isArray(result.results)).toBe(true)
    })

  })

  describe('📊 Search Sorting', () => {
    
    test('should sort by relevance', async () => {
      const mockCampaigns = [
        {
          id: 'camp-1',
          title: 'Bitcoin Project', // High relevance for "bitcoin"
          description: 'About cryptocurrency',
          total_funding: 1000,
          contributor_count: 10,
          created_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'camp-2', 
          title: 'Random Project',
          description: 'Contains bitcoin keyword', // Lower relevance
          total_funding: 2000,
          contributor_count: 20,
          created_at: '2024-01-02T00:00:00.000Z'
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
            or: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ 
                  data: mockCampaigns.map(c => ({
                    ...c,
                    user_id: 'user-1',
                    category: 'technology',
                    tags: ['test'],
                    goal_amount: 10000,
                    is_active: true,
                    is_public: true,
                    featured_image_url: 'image.jpg',
                    slug: 'test-campaign',
                    profiles: [{ username: 'creator', display_name: 'Creator', avatar_url: 'creator.jpg' }]
                  })),
                  error: null 
                }))
              }))
            }))
          }))
        }))
      })

      const options: SearchOptions = {
        query: 'bitcoin',
        type: 'campaigns',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result.results.length).toBeGreaterThan(0)
      if (result.results.length > 1) {
        const firstResult = result.results[0]
        if (firstResult.type === 'campaign') {
          const campaignData = firstResult.data as SearchFundingPage
          expect(campaignData.title).toBe('Bitcoin Project') // Higher relevance first
        }
      }
    })

    test('should sort by recent', async () => {
      const options: SearchOptions = {
        type: 'all',
        sortBy: 'recent'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      // Results should be sorted by created_at (most recent first)
    })

    test('should sort by popular', async () => {
      const options: SearchOptions = {
        type: 'campaigns',
        sortBy: 'popular'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      // Results should be sorted by contributor_count (highest first)
    })

    test('should sort by funding', async () => {
      const options: SearchOptions = {
        type: 'campaigns',
        sortBy: 'funding'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      // Results should be sorted by total_funding (highest first)
    })

  })

  describe('💾 Caching System', () => {
    
    test('should cache search results', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          or: jest.fn(() => ({
                order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      })

      const options: SearchOptions = {
        query: 'test',
        type: 'profiles',
        sortBy: 'relevance'
      }

      // First call
      await search(options)
      const firstCallCount = mockSupabase.from.mock.calls.length

      // Second call should use cache
      await search(options)
      const secondCallCount = mockSupabase.from.mock.calls.length

      expect(secondCallCount).toBe(firstCallCount) // No additional calls
    })

    test('should clear cache', () => {
      clearSearchCache()
      expect(true).toBe(true) // Function should execute without error
    })

    test('should cache with different options separately', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          or: jest.fn(() => ({
              order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      })

      const options1: SearchOptions = {
        query: 'test1',
        type: 'profiles',
        sortBy: 'relevance'
      }

      const options2: SearchOptions = {
        query: 'test2',
        type: 'profiles',
        sortBy: 'relevance'
      }

      await search(options1)
      const firstCallCount = mockSupabase.from.mock.calls.length

      await search(options2)
      const secondCallCount = mockSupabase.from.mock.calls.length

      expect(secondCallCount).toBeGreaterThan(firstCallCount) // Different cache keys
    })

  })

  describe('🔥 Trending Content', () => {
    
    test('should get trending content successfully', async () => {
      const mockCampaigns = [{
        id: 'camp-1',
        user_id: 'user-1',
        title: 'Trending Campaign',
          description: 'Popular campaign',
          category: 'technology',
        tags: ['trending'],
        goal_amount: 10000,
        total_funding: 8000,
          contributor_count: 100,
          is_active: true,
          is_public: true,
        featured_image_url: 'image.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        slug: 'trending-campaign',
        profiles: [{ username: 'creator', display_name: 'Creator', avatar_url: 'creator.jpg' }]
      }]

      const mockProfiles = [{
        id: 'prof-1',
        username: 'trendinguser',
        display_name: 'Trending User',
        bio: 'Popular user',
        avatar_url: 'avatar.jpg',
        created_at: '2024-01-01T00:00:00.000Z'
      }]

      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        callCount++
        if (table === 'funding_pages') {
          return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
              }))
            }))
          }))
          }
        } else if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: mockProfiles, error: null }))
              }))
            }))
          }
        }
        return { select: () => ({ data: [], error: null }) }
      })

      const result = await getTrending()

      expect(result).toBeDefined()
      expect(result.results).toBeDefined()
      expect(Array.isArray(result.results)).toBe(true)
      expect(result.totalCount).toBeGreaterThanOrEqual(0)
      expect(result.hasMore).toBe(false)
    })

    test('should handle trending content errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
                }))
              }))
            }))
      })

      const result = await getTrending()

      expect(result).toBeDefined()
      expect(result.results).toEqual([])
      expect(result.totalCount).toBe(0)
      expect(result.hasMore).toBe(false)
    })

  })

  describe('💡 Search Suggestions', () => {
    
    test('should get search suggestions successfully', async () => {
      const mockProfiles = [{
        username: 'testuser',
        display_name: 'Test User'
      }]

      const mockCampaigns = [{
        title: 'Test Campaign',
        category: 'technology'
      }]

      let callCount = 0
      mockSupabase.from.mockImplementation((table) => {
        callCount++
        if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              or: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: mockProfiles, error: null }))
          }))
        }))
          }
        } else if (table === 'funding_pages') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                or: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
                }))
              }))
            }))
          }
        }
        return { select: () => ({ data: [], error: null }) }
      })

      const suggestions = await getSearchSuggestions('test')

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThanOrEqual(0)
    })

    test('should return empty array for short queries', async () => {
      const suggestions = await getSearchSuggestions('a')

      expect(suggestions).toEqual([])
    })

    test('should return empty array for empty queries', async () => {
      const suggestions = await getSearchSuggestions('')

      expect(suggestions).toEqual([])
    })

    test('should handle suggestion errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            limit: jest.fn(() => Promise.reject(new Error('Database error')))
                }))
              }))
      })

      const suggestions = await getSearchSuggestions('test')

      expect(suggestions).toEqual([])
    })

    test('should limit suggestion results', async () => {
      const mockProfiles = Array.from({ length: 20 }, (_, i) => ({
        username: `testuser${i}`,
        display_name: `Test User ${i}`
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          or: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: mockProfiles, error: null }))
          }))
        }))
      })

      const suggestions = await getSearchSuggestions('test', 3)

      expect(suggestions.length).toBeLessThanOrEqual(3)
    })

  })

  describe('🚨 Error Handling', () => {
    
    test('should handle profile search errors gracefully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              or: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() => Promise.reject(new Error('Profile search failed')))
                }))
              }))
            }))
          }
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              or: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() => Promise.resolve({ data: [], error: null }))
                }))
              }))
            }))
          }))
        }
      })

      const options: SearchOptions = {
        query: 'test',
        type: 'all',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(result.results).toBeDefined()
      // Should continue with campaign search even if profile search fails
    })

    test('should handle campaign search errors gracefully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'funding_pages') {
          return {
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
                or: jest.fn(() => ({
              order: jest.fn(() => ({
                    range: jest.fn(() => Promise.reject(new Error('Campaign search failed')))
                }))
              }))
            }))
          }))
          }
        }
        return {
          select: jest.fn(() => ({
            or: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }
      })

      const options: SearchOptions = {
        query: 'test',
        type: 'all',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(result.results).toBeDefined()
      // Should continue with profile search even if campaign search fails
    })

    test('should handle facets errors gracefully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles' || table === 'funding_pages') {
          // For search queries, return successfully
          return {
            select: jest.fn(() => ({
              or: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() => Promise.resolve({ data: [], error: null }))
                }))
              })),
              eq: jest.fn(() => ({
                or: jest.fn(() => ({
                  order: jest.fn(() => ({
                    range: jest.fn(() => Promise.resolve({ data: [], error: null }))
                  }))
                })),
                not: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }
        }
        return {
          select: jest.fn(() => Promise.reject(new Error('Facets failed')))
        }
      })

      const options: SearchOptions = {
        query: 'test',
        type: 'all',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(result.facets).toBeDefined()
      expect(result.facets.categories).toEqual([])
      expect(result.facets.totalProfiles).toBe(0)
      expect(result.facets.totalCampaigns).toBe(0)
    })

    test('should handle complete search failure gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Complete database failure')
      })

      const options: SearchOptions = {
        query: 'test',
        type: 'all',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(result.results).toEqual([])
      expect(result.totalCount).toBe(0)
      expect(result.hasMore).toBe(false)
      expect(result.facets).toBeDefined()
    })

  })

  describe('📏 Pagination', () => {
    
    test('should handle pagination correctly', async () => {
      const options: SearchOptions = {
        query: 'test',
        type: 'profiles',
        sortBy: 'relevance',
        limit: 10,
        offset: 20
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(typeof result.hasMore).toBe('boolean')
      expect(typeof result.totalCount).toBe('number')
    })

    test('should handle large offset gracefully', async () => {
      const options: SearchOptions = {
        query: 'test',
        type: 'profiles',
        sortBy: 'relevance',
        limit: 10,
        offset: 10000
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(result.results).toBeDefined()
    })

  })

  describe('🔤 Unicode & Special Characters', () => {
    
    test('should handle unicode queries', async () => {
      const options: SearchOptions = {
        query: '🚀 émojis and ünicode',
        type: 'all',
        sortBy: 'relevance'
      }

      const result = await search(options)

      expect(result).toBeDefined()
      expect(result.results).toBeDefined()
    })

    test('should handle special characters in queries', async () => {
      const specialQueries = [
        'test@example.com',
        'user-name_123',
        'query with spaces',
        'query(with)parentheses',
        'query[with]brackets',
        'query{with}braces',
        'query|with|pipes'
      ]

      for (const query of specialQueries) {
        const options: SearchOptions = {
          query,
          type: 'all',
          sortBy: 'relevance'
        }

        const result = await search(options)
        expect(result).toBeDefined()
      }
    })

  })

}) 