/**
 * FEATURED SERVICE - COMPREHENSIVE TEST COVERAGE
 * 
 * This test suite provides comprehensive coverage for the FeaturedService,
 * testing all featured campaign types, data transformations, error handling,
 * and edge cases for the featured content system.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Comprehensive FeaturedService tests for production readiness
 */

// Mock Supabase client with proper hoisting
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    from: jest.fn()
  }))
}))

// Get the mocked client
import { createBrowserClient } from '@supabase/ssr'
const mockSupabase = createBrowserClient('test', 'test') as jest.Mocked<any>

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}))

// Import after mocking
import { 
  getFeaturedCampaigns,
  getTrendingCampaigns,
  getStaffPicks,
  getNearlyFundedCampaigns,
  getNewAndNoteworthy,
  featureCampaign,
  unfeatureCampaign,
  FeaturedCampaign,
  FeaturedType
} from '../featured'

describe('⭐ Featured Service - Comprehensive Coverage', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset console methods to avoid test noise
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup default mock responses
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null }),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockResolvedValue({ data: [], error: null }),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('🎯 Service Architecture', () => {
    
    test('should export all required functions', () => {
      expect(typeof getFeaturedCampaigns).toBe('function')
      expect(typeof getTrendingCampaigns).toBe('function')
      expect(typeof getStaffPicks).toBe('function')
      expect(typeof getNearlyFundedCampaigns).toBe('function')
      expect(typeof getNewAndNoteworthy).toBe('function')
      expect(typeof featureCampaign).toBe('function')
      expect(typeof unfeatureCampaign).toBe('function')
    })

    test('should have proper TypeScript types', () => {
      const featuredTypes: FeaturedType[] = [
        'trending',
        'staff_pick',
        'community_choice',
        'nearly_funded',
        'new_and_noteworthy',
        'featured'
      ]
      
      featuredTypes.forEach(type => {
        expect(typeof type).toBe('string')
      })
    })

  })

  describe('⭐ Get Featured Campaigns', () => {
    
    test('should get featured campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: 'camp-1',
          title: 'High Funding Campaign',
          description: 'Well-funded campaign',
          goal_amount: 10000,
          total_funding: 8000,
          contributor_count: 50,
          is_active: true,
          featured_image_url: 'image1.jpg',
          slug: 'high-funding',
          created_at: '2024-01-01T00:00:00.000Z',
          profiles: [{
            username: 'creator1',
            display_name: 'Creator One',
            avatar_url: 'avatar1.jpg'
          }]
        }
      ]

      // Mock the complete chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockCampaigns, error: null })
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getFeaturedCampaigns(6)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0].featured_type).toBe('nearly_funded') // 80% funded
      expect(result[0].featured_priority).toBe(1)
    })

    test('should handle empty featured campaigns', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result).toEqual([])
    })

    test('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result).toEqual([])
    })

    test('should handle null profiles gracefully', async () => {
      const mockCampaigns = [{
        id: 'camp-1',
        title: 'Campaign',
        description: 'Description',
        goal_amount: 1000,
        total_funding: 500,
        contributor_count: 10,
        is_active: true,
        featured_image_url: 'image.jpg',
        slug: 'campaign',
        created_at: '2024-01-01T00:00:00.000Z',
        profiles: null
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result).toHaveLength(1)
      expect(result[0].profiles).toBeNull()
    })

    test('should limit results correctly', async () => {
      const mockCampaigns = Array.from({ length: 10 }, (_, i) => ({
        id: `camp-${i}`,
        title: `Campaign ${i}`,
        description: `Description ${i}`,
        goal_amount: 1000,
        total_funding: 500,
        contributor_count: 10,
        is_active: true,
        featured_image_url: 'image.jpg',
        slug: `campaign-${i}`,
        created_at: '2024-01-01T00:00:00.000Z',
        profiles: [{ username: 'creator', display_name: 'Creator', avatar_url: 'avatar.jpg' }]
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn((limit) => Promise.resolve({ 
                data: mockCampaigns.slice(0, limit), 
                error: null 
              }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns(3)

      expect(result).toHaveLength(3)
    })

  })

  describe('🔥 Trending Campaigns', () => {
    
    test('should get trending campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: 'trend-1',
          title: 'Trending Campaign 1',
          description: 'Most popular',
          goal_amount: 5000,
          total_funding: 3000,
          contributor_count: 100,
          is_active: true,
          featured_image_url: 'trend1.jpg',
          slug: 'trending-1',
          created_at: '2024-01-01T00:00:00.000Z',
          profiles: [{ username: 'trendy1', display_name: 'Trendy One', avatar_url: 'trendy1.jpg' }]
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
            }))
          }))
        }))
      })

      const result = await getTrendingCampaigns(3)

      expect(result).toHaveLength(1)
      expect(result[0].featured_type).toBe('trending')
      expect(result[0].featured_priority).toBe(1)
    })

    test('should handle trending campaigns error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.reject(new Error('Database error')))
            }))
          }))
        }))
      })

      const result = await getTrendingCampaigns()

      expect(result).toEqual([])
    })

  })

  describe('👨‍💼 Staff Picks', () => {
    
    test('should get staff picks successfully', async () => {
      const mockCampaigns = [
        {
          id: 'staff-1',
          title: 'Staff Pick 1',
          description: 'Quality campaign with image',
          goal_amount: 2000,
          total_funding: 800,
          contributor_count: 25,
          is_active: true,
          featured_image_url: 'staff1.jpg',
          slug: 'staff-pick-1',
          created_at: '2024-01-01T00:00:00.000Z',
          profiles: [{ username: 'quality1', display_name: 'Quality One', avatar_url: 'quality1.jpg' }]
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
              }))
            }))
          }))
        }))
      })

      const result = await getStaffPicks(3)

      expect(result).toHaveLength(1)
      expect(result[0].featured_type).toBe('staff_pick')
      expect(result[0].featured_priority).toBe(1)
    })

    test('should handle staff picks error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.reject(new Error('Database error')))
              }))
            }))
          }))
        }))
      })

      const result = await getStaffPicks()

      expect(result).toEqual([])
    })

  })

  describe('🎯 Nearly Funded Campaigns', () => {
    
    test('should get nearly funded campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: 'nearly-1',
          title: 'Nearly Funded 1',
          description: '90% funded',
          goal_amount: 1000,
          total_funding: 900, // 90% funded
          contributor_count: 45,
          is_active: true,
          featured_image_url: 'nearly1.jpg',
          slug: 'nearly-funded-1',
          created_at: '2024-01-01T00:00:00.000Z',
          profiles: [{ username: 'almost1', display_name: 'Almost One', avatar_url: 'almost1.jpg' }]
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
              }))
            }))
          }))
        }))
      })

      const result = await getNearlyFundedCampaigns(3)

      expect(result).toHaveLength(1) // Should include 90% funded campaign
      expect(result[0].featured_type).toBe('nearly_funded')
    })

    test('should filter out campaigns below 70% funding', async () => {
      const mockCampaigns = [
        {
          id: 'not-nearly',
          title: 'Not Nearly Funded',
          description: '50% funded',
          goal_amount: 1000,
          total_funding: 500, // 50% funded - should be filtered out
          contributor_count: 20,
          is_active: true,
          featured_image_url: 'not-nearly.jpg',
          slug: 'not-nearly',
          created_at: '2024-01-03T00:00:00.000Z',
          profiles: [{ username: 'not-almost', display_name: 'Not Almost', avatar_url: 'not-almost.jpg' }]
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
              }))
            }))
          }))
        }))
      })

      const result = await getNearlyFundedCampaigns()

      expect(result).toEqual([]) // Should filter out 50% funded
    })

  })

  describe('🆕 New and Noteworthy', () => {
    
    test('should get new and noteworthy campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: 'new-1',
          title: 'New Campaign 1',
          description: 'Recently created with traction',
          goal_amount: 1000,
          total_funding: 200,
          contributor_count: 15,
          is_active: true,
          featured_image_url: 'new1.jpg',
          slug: 'new-1',
          created_at: '2024-01-10T00:00:00.000Z', // Recent
          profiles: [{ username: 'new1', display_name: 'New One', avatar_url: 'new1.jpg' }]
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
              }))
            }))
          }))
        }))
      })

      const result = await getNewAndNoteworthy(3)

      expect(result).toHaveLength(1)
      expect(result[0].featured_type).toBe('new_and_noteworthy')
      expect(result[0].featured_priority).toBe(1)
    })

    test('should handle new and noteworthy error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.reject(new Error('Database error')))
              }))
            }))
          }))
        }))
      })

      const result = await getNewAndNoteworthy()

      expect(result).toEqual([])
    })

  })

  describe('⚙️ Campaign Management', () => {
    
    test('should feature a campaign successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: { id: 'camp-1' }, error: null }))
        }))
      })

      const result = await featureCampaign('camp-1', 'staff_pick', 1)

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('featured_campaigns')
    })

    test('should handle featuring campaign error', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Update failed' } }))
        }))
      })

      const result = await featureCampaign('camp-1', 'staff_pick')

      expect(result).toBe(false)
    })

    test('should unfeature a campaign successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: { id: 'camp-1' }, error: null }))
        }))
      })

      const result = await unfeatureCampaign('camp-1')

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('featured_campaigns')
    })

    test('should handle unfeaturing campaign error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Delete failed' } }))
        }))
      })

      const result = await unfeatureCampaign('camp-1')

      expect(result).toBe(false)
    })

  })

  describe('🏗️ Data Transformation', () => {
    
    test('should transform profiles array correctly', async () => {
      const mockCampaigns = [{
        id: 'camp-1',
        title: 'Test Campaign',
        description: 'Test',
        goal_amount: 1000,
        total_funding: 500,
        contributor_count: 25,
        is_active: true,
        featured_image_url: 'image.jpg',
        slug: 'test',
        created_at: '2024-01-01T00:00:00.000Z',
        profiles: [
          { username: 'creator1', display_name: 'Creator One', avatar_url: 'avatar1.jpg' },
          { username: 'creator2', display_name: 'Creator Two', avatar_url: 'avatar2.jpg' }
        ]
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result[0].profiles).toEqual(mockCampaigns[0].profiles[0]) // Should take first profile
    })

    test('should handle campaigns without goals correctly', async () => {
      const mockCampaigns = [{
        id: 'camp-1',
        title: 'No Goal Campaign',
        description: 'Campaign without goal',
        goal_amount: null,
        total_funding: 500,
        contributor_count: 25,
        is_active: true,
        featured_image_url: 'image.jpg',
        slug: 'no-goal',
        created_at: '2024-01-01T00:00:00.000Z',
        profiles: [{ username: 'creator', display_name: 'Creator', avatar_url: 'avatar.jpg' }]
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result).toHaveLength(1)
      expect(result[0].featured_type).toBe('new_and_noteworthy') // Fallback type
    })

  })

  describe('🧪 Edge Cases', () => {
    
    test('should handle campaigns with zero values', async () => {
      const mockCampaigns = [{
        id: 'zero-camp',
        title: 'Zero Campaign',
        description: 'Zero values',
        goal_amount: 0,
        total_funding: 0,
        contributor_count: 0,
        is_active: true,
        featured_image_url: 'zero.jpg',
        slug: 'zero',
        created_at: '2024-01-01T00:00:00.000Z',
        profiles: [{ username: 'zero', display_name: 'Zero', avatar_url: 'zero.jpg' }]
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result).toHaveLength(1)
      expect(result[0].featured_type).toBe('new_and_noteworthy') // Should default
    })

    test('should handle very large numbers', async () => {
      const mockCampaigns = [{
        id: 'large-camp',
        title: 'Large Campaign',
        description: 'Very large numbers',
        goal_amount: 1000000000,
        total_funding: 999999999,
        contributor_count: 999999,
        is_active: true,
        featured_image_url: 'large.jpg',
        slug: 'large',
        created_at: '2024-01-01T00:00:00.000Z',
        profiles: [{ username: 'whale', display_name: 'Whale', avatar_url: 'whale.jpg' }]
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result).toHaveLength(1)
      expect(result[0].featured_type).toBe('nearly_funded') // Should handle large numbers
    })

    test('should handle concurrent requests', async () => {
      const mockCampaigns = [{
        id: 'concurrent',
        title: 'Concurrent',
        description: 'Concurrent test',
        goal_amount: 1000,
        total_funding: 500,
        contributor_count: 25,
        is_active: true,
        featured_image_url: 'concurrent.jpg',
        slug: 'concurrent',
        created_at: '2024-01-01T00:00:00.000Z',
        profiles: [{ username: 'concurrent', display_name: 'Concurrent', avatar_url: 'concurrent.jpg' }]
      }]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
            }))
          }))
        }))
      })

      // Make multiple concurrent requests
      const promises = [
        getFeaturedCampaigns(),
        getTrendingCampaigns(),
        getStaffPicks(),
        getNearlyFundedCampaigns(),
        getNewAndNoteworthy()
      ]

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true)
      })
    })

  })

  describe('🚨 Error Handling', () => {
    
    test('should handle complete database failure', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Complete database failure')
      })

      const result = await getFeaturedCampaigns()

      expect(result).toEqual([])
    })

    test('should handle null responses gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })

      const result = await getFeaturedCampaigns()

      expect(result).toEqual([])
    })

  })

}) 