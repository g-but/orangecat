import { act, renderHook } from '@testing-library/react'

// Mock the Supabase client creation at the top level
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn()
    }
  }))
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

import { useCampaignStore } from '../campaignStore'

describe('campaignStore', () => {
  const mockUserId = 'user-123'
  const mockCampaignId = 'campaign-456'
  
  const mockCampaignData = {
    id: mockCampaignId,
    user_id: mockUserId,
    title: 'Test Campaign',
    description: 'Test Description',
    bitcoin_address: 'bc1q...',
    lightning_address: 'test@lightning.network',
    website_url: 'https://example.com',
    goal_amount: 1000000,
    total_funding: 0,
    contributor_count: 0,
    is_active: false,
    is_public: false,
    category: 'technology',
    tags: ['startup', 'bitcoin'],
    currency: 'BTC',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    // Campaign interface required fields
    isDraft: true,
    isActive: false,
    isPaused: false,
    lastModified: '2024-01-01T00:00:00.000Z',
    syncStatus: 'synced' as const
  }

  const mockFormData = {
    title: 'Test Campaign',
    description: 'Test Description',
    bitcoin_address: 'bc1q...',
    lightning_address: 'test@lightning.network',
    website_url: 'https://example.com',
    goal_amount: 1000000,
    categories: ['technology', 'startup'],
    images: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset store state
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

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      expect(result.current.campaigns).toEqual([])
      expect(result.current.currentDraft).toBeNull()
      expect(result.current.currentDraftId).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.lastSync).toBeNull()
    })

    it('should have correct computed getters', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      expect(result.current.drafts).toEqual([])
      expect(result.current.activeCampaigns).toEqual([])
    })
  })

  describe('loadCampaigns', () => {
    it('should load campaigns successfully', async () => {
      const campaigns = [mockCampaignData]
      mockSelect.mockResolvedValueOnce({ data: campaigns, error: null })
      
      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })
      
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId)
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false })
      
      expect(result.current.campaigns).toHaveLength(1)
      expect(result.current.campaigns[0]).toMatchObject({
        ...mockCampaignData,
        isDraft: true, // not active and not public
        isActive: false,
        isPaused: false,
        syncStatus: 'synced'
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.lastSync).toBeTruthy()
    })

    it('should handle loading error', async () => {
      const error = new Error('Database error')
      mockSelect.mockResolvedValueOnce({ data: null, error })
      
      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })
      
      expect(result.current.error).toBe('Database error')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.campaigns).toEqual([])
    })

    it('should set loading state during operation', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Mock a delayed response
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockSelect.mockReturnValueOnce(delayedPromise)
      
      act(() => {
        result.current.loadCampaigns(mockUserId)
      })
      
      expect(result.current.isLoading).toBe(true)
      
      await act(async () => {
        resolvePromise!({ data: [], error: null })
        await delayedPromise
      })
      
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('saveDraft', () => {
    it('should create new draft successfully', async () => {
      const createdCampaign = { ...mockCampaignData, id: 'new-id' }
      mockInsert.mockResolvedValueOnce({ data: createdCampaign, error: null })
      mockSelect.mockResolvedValueOnce({ data: createdCampaign, error: null })
      
      const { result } = renderHook(() => useCampaignStore())
      
      let savedId: string | undefined
      await act(async () => {
        savedId = await result.current.saveDraft(mockUserId, mockFormData, 1)
      })
      
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Test Campaign',
        description: 'Test Description',
        bitcoin_address: 'bc1q...',
        lightning_address: 'test@lightning.network',
        website_url: 'https://example.com',
        goal_amount: 1000000,
        category: 'technology',
        tags: ['startup'],
        currency: 'BTC',
        is_active: false,
        is_public: false,
        total_funding: 0,
        contributor_count: 0
      })
      
      expect(savedId).toBe('new-id')
      expect(result.current.currentDraftId).toBe('new-id')
      expect(result.current.currentDraft).toEqual(mockFormData)
      expect(result.current.isSyncing).toBe(false)
    })

    it('should update existing draft successfully', async () => {
      const updatedCampaign = { ...mockCampaignData, title: 'Updated Title' }
      mockUpdate.mockResolvedValueOnce({ data: updatedCampaign, error: null })
      mockSelect.mockResolvedValueOnce({ data: updatedCampaign, error: null })
      
      const { result } = renderHook(() => useCampaignStore())
      
      // Set existing draft ID
      act(() => {
        result.current.currentDraftId = mockCampaignId
      })
      
      await act(async () => {
        await result.current.saveDraft(mockUserId, mockFormData, 2)
      })
      
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', mockCampaignId)
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId)
      
      expect(result.current.currentDraftId).toBe(mockCampaignId)
      expect(result.current.isSyncing).toBe(false)
    })

    it('should handle save error', async () => {
      const error = new Error('Save failed')
      mockInsert.mockResolvedValueOnce({ data: null, error })
      
      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        try {
          await result.current.saveDraft(mockUserId, mockFormData)
        } catch (e) {
          expect(e).toEqual(error)
        }
      })
      
      expect(result.current.error).toBe('Save failed')
      expect(result.current.isSyncing).toBe(false)
    })

    it('should handle missing title with default', async () => {
      const formDataWithoutTitle = { ...mockFormData, title: '' }
      const createdCampaign = { ...mockCampaignData, title: 'Untitled Campaign' }
      
      mockInsert.mockResolvedValueOnce({ data: createdCampaign, error: null })
      mockSelect.mockResolvedValueOnce({ data: createdCampaign, error: null })
      
      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.saveDraft(mockUserId, formDataWithoutTitle)
      })
      
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Untitled Campaign' })
      )
    })
  })

  describe('updateDraftField', () => {
    it('should update existing draft field', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Set existing draft
      act(() => {
        result.current.currentDraft = mockFormData
      })
      
      act(() => {
        result.current.updateDraftField('title', 'New Title')
      })
      
      expect(result.current.currentDraft).toEqual({
        ...mockFormData,
        title: 'New Title'
      })
    })

    it('should create new draft when none exists', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.updateDraftField('title', 'New Title')
      })
      
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

    it('should handle numeric fields', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.updateDraftField('goal_amount', 500000)
      })
      
      expect(result.current.currentDraft?.goal_amount).toBe(500000)
    })

    it('should handle array fields', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.updateDraftField('categories', ['tech', 'startup'])
      })
      
      expect(result.current.currentDraft?.categories).toEqual(['tech', 'startup'])
    })
  })

  describe('clearCurrentDraft', () => {
    it('should clear current draft and ID', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Set draft data
      act(() => {
        result.current.currentDraft = mockFormData
        result.current.currentDraftId = mockCampaignId
      })
      
      act(() => {
        result.current.clearCurrentDraft()
      })
      
      expect(result.current.currentDraft).toBeNull()
      expect(result.current.currentDraftId).toBeNull()
    })
  })

  describe('Computed Getters', () => {
    it('should filter drafts correctly', () => {
      const draftCampaign = {
        ...mockCampaignData,
        id: 'draft-1',
        isDraft: true,
        isActive: false,
        isPaused: false
      }
      
      const activeCampaign = {
        ...mockCampaignData,
        id: 'active-1',
        isDraft: false,
        isActive: true,
        isPaused: false
      }
      
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.campaigns = [draftCampaign, activeCampaign]
      })
      
      expect(result.current.drafts).toEqual([draftCampaign])
      expect(result.current.activeCampaigns).toEqual([activeCampaign])
    })
  })

  describe('getCampaignById', () => {
    it('should find campaign by ID', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.campaigns = [mockCampaignData]
      })
      
      const found = result.current.getCampaignById(mockCampaignId)
      expect(found).toEqual(mockCampaignData)
    })

    it('should return undefined for non-existent ID', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const found = result.current.getCampaignById('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('hasUnsavedChanges', () => {
    it('should return false when no current draft', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      expect(result.current.hasUnsavedChanges()).toBe(false)
    })

    it('should return true when current draft exists', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.currentDraft = mockFormData
      })
      
      expect(result.current.hasUnsavedChanges()).toBe(true)
    })
  })

  describe('getStats', () => {
    it('should calculate stats correctly', () => {
      const campaigns = [
        {
          ...mockCampaignData,
          id: '1',
          isDraft: true,
          isActive: false,
          total_funding: 100000
        },
        {
          ...mockCampaignData,
          id: '2',
          isDraft: false,
          isActive: true,
          total_funding: 200000
        },
        {
          ...mockCampaignData,
          id: '3',
          isDraft: true,
          isActive: false,
          total_funding: 50000
        }
      ]
      
      const { result } = renderHook(() => useCampaignStore())
      
      act(() => {
        result.current.campaigns = campaigns
      })
      
      const stats = result.current.getStats()
      
      expect(stats).toEqual({
        totalCampaigns: 3,
        totalDrafts: 2,
        totalActive: 1,
        totalRaised: 350000 // Sum of all total_funding
      })
    })

    it('should handle empty campaigns array', () => {
      const { result } = renderHook(() => useCampaignStore())
      
      const stats = result.current.getStats()
      
      expect(stats).toEqual({
        totalCampaigns: 0,
        totalDrafts: 0,
        totalActive: 0,
        totalRaised: 0
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSelect.mockRejectedValueOnce(new Error('Network error'))
      
      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })
      
      expect(result.current.error).toBe('Failed to load campaigns')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle invalid data gracefully', async () => {
      mockSelect.mockResolvedValueOnce({ data: null, error: null })
      
      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })
      
      expect(result.current.campaigns).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('State Consistency', () => {
    it('should maintain sync status correctly', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Test sync status during save operation
      const savePromise = act(async () => {
        await result.current.saveDraft(mockUserId, mockFormData)
      })
      
      expect(result.current.isSyncing).toBe(true)
      
      await savePromise
      
      expect(result.current.isSyncing).toBe(false)
    })

    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Set initial error
      act(() => {
        result.current.error = 'Previous error'
      })
      
      mockSelect.mockResolvedValueOnce({ data: [], error: null })
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })
      
      expect(result.current.error).toBeNull()
    })
  })
}) 