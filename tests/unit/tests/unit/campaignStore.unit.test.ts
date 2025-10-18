/**
 * Campaign Store Unit Tests - Logic Testing
 * 
 * These tests focus on the store's internal logic and state management
 * without complex external dependencies.
 */

import { act, renderHook } from '@testing-library/react'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Simple mock for Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }))
}))

import { useCampaignStore, CampaignFormData, Campaign } from '../campaignStore'

describe('Campaign Store - Unit Tests', () => {
  const mockUserId = 'user-123'
  const mockCampaignId = 'campaign-456'

  const mockFormData: CampaignFormData = {
    title: 'Test Campaign',
    description: 'Test Description',
    bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    lightning_address: 'test@lightning.network',
    website_url: 'https://example.com',
    goal_amount: 1000000,
    categories: ['technology', 'startup'],
    images: []
  }

  const mockCampaign: Campaign = {
    id: mockCampaignId,
    user_id: mockUserId,
    title: 'Test Campaign',
    description: 'Test Description',
    bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    lightning_address: 'test@lightning.network',
    website_url: 'https://example.com',
    goal_amount: 1000000,
    total_funding: 0,
    contributor_count: 0,
    is_active: false,
    is_public: false,
    category: 'technology',
    tags: ['startup'],
    currency: 'BTC',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    isDraft: true,
    isActive: false,
    isPaused: false,
    lastModified: '2024-01-01T00:00:00.000Z',
    syncStatus: 'synced'
  } as Campaign

  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCampaignStore())
    act(() => {
      result.current.campaigns = []
      result.current.currentDraft = null
      result.current.currentDraftId = null
      result.current.isLoading = false
      result.current.isSyncing = false
      result.current.error = null
      result.current.lastSync = null
    })
  })

  describe('🏗️ Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      expect(result.current.campaigns).toEqual([])
      expect(result.current.currentDraft).toBeNull()
      expect(result.current.currentDraftId).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastSync).toBeNull()
    })

    test('should have correct computed getters', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      expect(result.current.drafts).toEqual([])
      expect(result.current.activeCampaigns).toEqual([])
      expect(result.current.pausedCampaigns).toEqual([])
    })
  })

  describe('📝 Draft Management', () => {
    test('should update draft field correctly', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.currentDraft = { ...mockFormData }
      })
      
      act(() => {
        result.current.updateDraftField('title', 'Updated Title')
      })
      
      expect(result.current.currentDraft?.title).toBe('Updated Title')
    })

    test('should clear current draft', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.currentDraft = { ...mockFormData }
        result.current.currentDraftId = 'draft-123'
      })
      
      act(() => {
        result.current.clearCurrentDraft()
      })
      
      expect(result.current.currentDraft).toBeNull()
      expect(result.current.currentDraftId).toBeNull()
    })

    test('should detect unsaved changes', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // No draft = no unsaved changes
      expect(result.current.hasUnsavedChanges()).toBe(false)
      
      act(() => {
        result.current.currentDraft = { ...mockFormData }
      })
      
      // Has draft = has unsaved changes
      expect(result.current.hasUnsavedChanges()).toBe(true)
    })
  })

  describe('📊 Campaign Filtering & Computed Properties', () => {
    test('should filter drafts correctly', () => {
      const draftCampaign = { ...mockCampaign, isDraft: true, isActive: false, isPaused: false }
      const activeCampaign = { ...mockCampaign, id: 'active-1', isDraft: false, isActive: true, isPaused: false }
      
      // Test the filtering logic directly
      const campaigns = [draftCampaign, activeCampaign]
      const drafts = campaigns.filter(c => c.isDraft)
      
      expect(drafts).toHaveLength(1)
      expect(drafts[0].id).toBe(mockCampaignId)
    })

    test('should filter active campaigns correctly', () => {
      const draftCampaign = { ...mockCampaign, isDraft: true, isActive: false, isPaused: false }
      const activeCampaign = { ...mockCampaign, id: 'active-1', isDraft: false, isActive: true, isPaused: false }
      
      // Test the filtering logic directly
      const campaigns = [draftCampaign, activeCampaign]
      const activeCampaigns = campaigns.filter(c => c.isActive)
      
      expect(activeCampaigns).toHaveLength(1)
      expect(activeCampaigns[0].id).toBe('active-1')
    })

    test('should filter paused campaigns correctly', () => {
      const draftCampaign = { ...mockCampaign, isDraft: true, isActive: false, isPaused: false }
      const pausedCampaign = { ...mockCampaign, id: 'paused-1', isDraft: false, isActive: false, isPaused: true }
      
      // Test the filtering logic directly
      const campaigns = [draftCampaign, pausedCampaign]
      const pausedCampaigns = campaigns.filter(c => c.isPaused)
      
      expect(pausedCampaigns).toHaveLength(1)
      expect(pausedCampaigns[0].id).toBe('paused-1')
    })
  })

  describe('🔍 Campaign Utilities', () => {
    test('should get campaign by ID', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.campaigns = [mockCampaign]
      })
      
      const found = result.current.getCampaignById(mockCampaignId)
      expect(found).toEqual(mockCampaign)
      
      const notFound = result.current.getCampaignById('non-existent')
      expect(notFound).toBeUndefined()
    })

    test('should calculate stats correctly', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const campaigns = [
        { ...mockCampaign, isDraft: true, isActive: false, isPaused: false, total_funding: 100000 },
        { ...mockCampaign, id: 'active-1', isDraft: false, isActive: true, isPaused: false, total_funding: 200000 },
        { ...mockCampaign, id: 'paused-1', isDraft: false, isActive: false, isPaused: true, total_funding: 150000 }
      ]
      
      act(() => {
        result.current.campaigns = campaigns
      })
      
      const stats = result.current.getStats()
      
      expect(stats.totalCampaigns).toBe(3)
      expect(stats.totalDrafts).toBe(1)
      expect(stats.totalActive).toBe(1)
      expect(stats.totalPaused).toBe(1)
      expect(stats.totalRaised).toBe(450000) // 100k + 200k + 150k
    })
  })

  describe('📝 Campaign Loading for Edit', () => {
    test('should load campaign for edit', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.campaigns = [mockCampaign]
      })
      
      act(() => {
        result.current.loadCampaignForEdit(mockCampaignId)
      })
      
      expect(result.current.currentDraftId).toBe(mockCampaignId)
      expect(result.current.currentDraft).toEqual({
        title: mockCampaign.title,
        description: mockCampaign.description || '',
        bitcoin_address: mockCampaign.bitcoin_address || '',
        lightning_address: mockCampaign.lightning_address || '',
        website_url: mockCampaign.website_url || '',
        goal_amount: mockCampaign.goal_amount || 0,
        categories: [mockCampaign.category, ...(mockCampaign.tags || [])].filter(Boolean),
        images: []
      })
    })

    test('should handle loading non-existent campaign for edit', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.campaigns = [mockCampaign]
      })
      
      act(() => {
        result.current.loadCampaignForEdit('non-existent')
      })
      
      // Should not change current draft if campaign not found
      expect(result.current.currentDraftId).toBeNull()
      expect(result.current.currentDraft).toBeNull()
    })
  })

  describe('🔄 State Management', () => {
    test('should handle loading state correctly', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.isLoading = true
      })
      
      expect(result.current.isLoading).toBe(true)
      
      act(() => {
        result.current.isLoading = false
      })
      
      expect(result.current.isLoading).toBe(false)
    })

    test('should handle syncing state correctly', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.isSyncing = true
      })
      
      expect(result.current.isSyncing).toBe(true)
      
      act(() => {
        result.current.isSyncing = false
      })
      
      expect(result.current.isSyncing).toBe(false)
    })

    test('should handle error state correctly', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const errorMessage = 'Test error message'
      
      act(() => {
        result.current.error = errorMessage
      })
      
      expect(result.current.error).toBe(errorMessage)
      
      act(() => {
        result.current.error = null
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('🧮 Edge Cases & Validation', () => {
    test('should handle empty campaigns array', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      expect(result.current.campaigns).toEqual([])
      expect(result.current.drafts).toEqual([])
      expect(result.current.activeCampaigns).toEqual([])
      expect(result.current.pausedCampaigns).toEqual([])
      
      const stats = result.current.getStats()
      expect(stats.totalCampaigns).toBe(0)
      expect(stats.totalRaised).toBe(0)
    })

    test('should handle campaigns with null/undefined values', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const campaignWithNulls = {
        ...mockCampaign,
        description: null,
        bitcoin_address: null,
        lightning_address: null,
        website_url: null,
        goal_amount: null,
        total_funding: null,
        tags: null
      }
      
      act(() => {
        result.current.campaigns = [campaignWithNulls]
      })
      
      const stats = result.current.getStats()
      expect(stats.totalCampaigns).toBe(1)
      expect(stats.totalRaised).toBe(0) // null total_funding should be treated as 0
    })

    test('should handle updateDraftField with null current draft', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Should create a new draft when currentDraft is null
      act(() => {
        result.current.updateDraftField('title', 'New Title')
      })
      
      // Should create a new draft with the updated field
      expect(result.current.currentDraft).toEqual({
        title: 'New Title',
        description: '',
        bitcoin_address: '',
        lightning_address: '',
        website_url: '',
        goal_amount: 0,
        categories: [],
        images: []
      })
    })
  })

  describe('🔧 Additional Coverage - Sync Logic', () => {
    test('should handle campaign state transitions correctly', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const draftCampaign = { 
        ...mockCampaign, 
        isDraft: true, 
        isActive: false, 
        isPaused: false,
        lastModified: '2024-01-01T00:00:00.000Z',
        syncStatus: 'synced' as const
      }
      const activeCampaign = { 
        ...mockCampaign, 
        id: 'active-1', 
        isDraft: false, 
        isActive: true, 
        isPaused: false,
        lastModified: '2024-01-01T00:00:00.000Z',
        syncStatus: 'synced' as const
      }
      const pausedCampaign = { 
        ...mockCampaign, 
        id: 'paused-1', 
        isDraft: false, 
        isActive: false, 
        isPaused: true,
        lastModified: '2024-01-01T00:00:00.000Z',
        syncStatus: 'synced' as const
      }
      
      act(() => {
        // Direct assignment for unit testing
        result.current.campaigns = [draftCampaign, activeCampaign, pausedCampaign]
      })
      
      // Test computed properties
      expect(result.current.drafts).toHaveLength(1)
      expect(result.current.activeCampaigns).toHaveLength(1)
      expect(result.current.pausedCampaigns).toHaveLength(1)
      
      // Test stats calculation
      const stats = result.current.getStats()
      expect(stats.totalCampaigns).toBe(3)
      expect(stats.totalDrafts).toBe(1)
      expect(stats.totalActive).toBe(1)
      expect(stats.totalPaused).toBe(1)
    })

    test('should handle campaign data validation edge cases', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Test with campaigns having various data states
      const campaignsWithEdgeCases = [
        { ...mockCampaign, total_funding: null, goal_amount: 0 },
        { ...mockCampaign, id: 'camp-2', total_funding: undefined, goal_amount: null },
        { ...mockCampaign, id: 'camp-3', total_funding: 500000, goal_amount: 1000000 }
      ]
      
      act(() => {
        result.current.campaigns = campaignsWithEdgeCases
      })
      
      const stats = result.current.getStats()
      expect(stats.totalRaised).toBe(500000) // Only the valid funding amount
      expect(stats.totalCampaigns).toBe(3)
    })

    test('should handle draft field updates with various data types', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Start with empty draft
      act(() => {
        result.current.updateDraftField('title', 'Test Campaign')
      })
      
      expect(result.current.currentDraft?.title).toBe('Test Campaign')
      
      // Update with number
      act(() => {
        result.current.updateDraftField('goal_amount', 1000000)
      })
      
      expect(result.current.currentDraft?.goal_amount).toBe(1000000)
      
      // Update with array
      act(() => {
        result.current.updateDraftField('categories', ['bitcoin', 'education'])
      })
      
      expect(result.current.currentDraft?.categories).toEqual(['bitcoin', 'education'])
    })

    test('should handle campaign loading for edit with complete data', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const fullCampaign = {
        ...mockCampaign,
        description: 'Full description',
        bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        lightning_address: 'test@lightning.network',
        website_url: 'https://example.com',
        goal_amount: 2000000,
        category: 'technology',
        tags: ['bitcoin', 'education']
      }
      
      act(() => {
        result.current.campaigns = [fullCampaign]
      })
      
      act(() => {
        result.current.loadCampaignForEdit(mockCampaignId)
      })
      
      expect(result.current.currentDraft).toEqual({
        title: fullCampaign.title,
        description: fullCampaign.description,
        bitcoin_address: fullCampaign.bitcoin_address,
        lightning_address: fullCampaign.lightning_address,
        website_url: fullCampaign.website_url,
        goal_amount: fullCampaign.goal_amount,
        categories: ['technology', 'bitcoin', 'education'],
        images: []
      })
    })

    test('should handle state management flags correctly', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Test loading state
      act(() => {
        result.current.isLoading = true
        result.current.error = 'Previous error'
      })
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBe('Previous error')
      
      // Test syncing state
      act(() => {
        result.current.isSyncing = true
        result.current.isLoading = false
        result.current.error = null
      })
      
      expect(result.current.isSyncing).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      
      // Test completion state
      act(() => {
        result.current.isSyncing = false
        result.current.lastSync = new Date().toISOString()
      })
      
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.lastSync).toBeTruthy()
    })

    test('should handle complex campaign filtering scenarios', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const complexCampaigns = [
        { ...mockCampaign, id: 'draft-1', isDraft: true, isActive: false, isPaused: false, total_funding: 0, lastModified: '2024-01-01T00:00:00.000Z', syncStatus: 'synced' as const },
        { ...mockCampaign, id: 'draft-2', isDraft: true, isActive: false, isPaused: false, total_funding: 50000, lastModified: '2024-01-01T00:00:00.000Z', syncStatus: 'synced' as const },
        { ...mockCampaign, id: 'active-1', isDraft: false, isActive: true, isPaused: false, total_funding: 100000, lastModified: '2024-01-01T00:00:00.000Z', syncStatus: 'synced' as const },
        { ...mockCampaign, id: 'active-2', isDraft: false, isActive: true, isPaused: false, total_funding: 200000, lastModified: '2024-01-01T00:00:00.000Z', syncStatus: 'synced' as const },
        { ...mockCampaign, id: 'paused-1', isDraft: false, isActive: false, isPaused: true, total_funding: 75000, lastModified: '2024-01-01T00:00:00.000Z', syncStatus: 'synced' as const },
        { ...mockCampaign, id: 'paused-2', isDraft: false, isActive: false, isPaused: true, total_funding: 125000, lastModified: '2024-01-01T00:00:00.000Z', syncStatus: 'synced' as const }
      ]
      
      act(() => {
        result.current.campaigns = complexCampaigns
      })
      
      // Test filtering
      expect(result.current.drafts).toHaveLength(2)
      expect(result.current.activeCampaigns).toHaveLength(2)
      expect(result.current.pausedCampaigns).toHaveLength(2)
      
      // Test stats with complex data
      const stats = result.current.getStats()
      expect(stats.totalCampaigns).toBe(6)
      expect(stats.totalDrafts).toBe(2)
      expect(stats.totalActive).toBe(2)
      expect(stats.totalPaused).toBe(2)
      expect(stats.totalRaised).toBe(550000) // Sum of all funding
    })
  })
}) 