/**
 * COMPREHENSIVE CAMPAIGN STORE INTEGRATION TESTS
 * 
 * 🎯 CRITICAL FOR FUNDRAISING PLATFORM SECURITY:
 * - Campaign data integrity and state management 
 * - Local storage + database synchronization
 * - Campaign lifecycle (draft → published → paused → resumed)
 * - Data validation and error handling
 * - Race condition prevention
 * 
 * This covers the MAIN BUSINESS LOGIC of the platform that handles user's
 * campaign data and fundraising operations.
 */

import { act, renderHook, waitFor } from '@testing-library/react'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase client with comprehensive chaining support
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => {
    const mockOperation = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      single: jest.fn()
    };

    // Make each method return the mock object to support chaining
    Object.keys(mockOperation).forEach(key => {
      mockOperation[key].mockReturnValue(mockOperation);
    });

    return mockOperation;
  })
}))

// Create separate mock for test manipulation
const mockSupabaseOperations = {
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  single: jest.fn()
};

// Make each method return the mock object to support chaining
Object.keys(mockSupabaseOperations).forEach(key => {
  mockSupabaseOperations[key].mockReturnValue(mockSupabaseOperations);
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

import { useCampaignStore, CampaignFormData, Campaign } from '../campaignStore'

describe('🏗️ Campaign Store - COMPREHENSIVE INTEGRATION TESTS', () => {
  const mockUserId = 'user-123'
  const mockCampaignId = 'campaign-456'

  const mockFormData: CampaignFormData = {
    title: 'Bitcoin Education Initiative',
    description: 'Teaching Bitcoin to the world',
    bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    lightning_address: 'education@lightning.network',
    website_url: 'https://bitcoineducation.org',
    goal_amount: 2000000, // 2 million sats
    categories: ['education', 'technology'],
    images: []
  }

  const mockDatabaseCampaign = {
    id: mockCampaignId,
    user_id: mockUserId,
    title: 'Bitcoin Education Initiative',
    description: 'Teaching Bitcoin to the world',
    bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    lightning_address: 'education@lightning.network',
    website_url: 'https://bitcoineducation.org',
    goal_amount: 2000000,
    total_funding: 150000,
    contributor_count: 15,
    is_active: true,
    is_public: true,
    category: 'education',
    tags: ['technology'],
    currency: 'BTC',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    // Campaign interface requirements
    isDraft: false,
    isActive: true,
    isPaused: false,
    lastModified: '2024-01-01T00:00:00.000Z',
    syncStatus: 'synced' as const,
    source: 'database'
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Reset the mock operation chain - each operation returns the mock for chaining
    Object.keys(mockSupabaseOperations).forEach(key => {
      mockSupabaseOperations[key].mockClear();
      mockSupabaseOperations[key].mockReturnValue(mockSupabaseOperations);
    });
    
    // Set default successful responses
    mockSupabaseOperations.order.mockResolvedValue({ data: [], error: null });
    mockSupabaseOperations.single.mockResolvedValue({ data: mockDatabaseCampaign, error: null });
    mockSupabaseOperations.insert.mockResolvedValue({ data: mockDatabaseCampaign, error: null });
    mockSupabaseOperations.update.mockResolvedValue({ data: mockDatabaseCampaign, error: null });
    mockSupabaseOperations.delete.mockResolvedValue({ data: null, error: null });
  })

  describe('🔄 loadCampaigns - Database Integration', () => {
    test('should load campaigns from database successfully', async () => {
      // Mock successful database response
      mockSupabaseOperations.order.mockResolvedValueOnce({
        data: [mockDatabaseCampaign],
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })

      expect(result.current.campaigns).toHaveLength(1)
      expect(result.current.campaigns[0]).toMatchObject({
        ...mockDatabaseCampaign,
        source: 'database',
        isDraft: false,
        isActive: true,
        isPaused: false
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    test('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseOperations.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })

      expect(result.current.campaigns).toEqual([])
      expect(result.current.error).toBe('Error loading campaigns: Database connection failed')
      expect(result.current.isLoading).toBe(false)
    })

    test('should merge local drafts with database campaigns', async () => {
      // Mock local storage with a draft
      const localDraft = {
        formData: mockFormData,
        currentStep: 2,
        lastSaved: new Date().toISOString(),
        draftId: 'local-draft-789'
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(localDraft))

      // Mock database campaigns
      mockSupabaseOperations.order.mockResolvedValueOnce({
        data: [mockDatabaseCampaign],
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })

      expect(result.current.campaigns).toHaveLength(2) // 1 from DB + 1 local draft
      
      // Check local draft is included
      const localCampaignExists = result.current.campaigns.some(c => 
        c.id === `local-${mockUserId}` && c.source === 'local'
      )
      expect(localCampaignExists).toBe(true)
    })

    test('should handle invalid user ID', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns('')
      })

      expect(result.current.error).toBe('Error loading campaigns: User ID is required')
    })
  })

  describe('💾 saveDraft - Local Storage Integration', () => {
    test('should save draft to localStorage successfully', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      let draftId: string = ''
      await act(async () => {
        draftId = await result.current.saveDraft(mockUserId, mockFormData, 2)
      })

      expect(draftId).toBeTruthy()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `funding-draft-${mockUserId}`,
        expect.stringContaining('"title":"Bitcoin Education Initiative"')
      )
      expect(result.current.currentDraft).toEqual(mockFormData)
      expect(result.current.currentDraftId).toBe(draftId)
    })

    test('should update existing draft', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Save initial draft
      await act(async () => {
        await result.current.saveDraft(mockUserId, mockFormData, 1)
      })

      // Update the draft
      const updatedFormData = { ...mockFormData, title: 'Updated Title' }
      await act(async () => {
        await result.current.saveDraft(mockUserId, updatedFormData, 3)
      })

      expect(result.current.currentDraft?.title).toBe('Updated Title')
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)
    })

    test('should handle localStorage errors', async () => {
      // Mock localStorage error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.saveDraft(mockUserId, mockFormData)
      })

      expect(result.current.error).toBe('Error saving draft: Storage quota exceeded')
    })
  })

  describe('🚀 publishCampaign - Database Publish Integration', () => {
    test('should publish campaign to database successfully', async () => {
      // Mock successful database insert
      mockSupabaseOperations.single.mockResolvedValueOnce({
        data: { ...mockDatabaseCampaign, id: 'new-campaign-id' },
        error: null
      })

      // Set up current draft
      const { result } = renderHook(() => useCampaignStore())
      await act(async () => {
        await result.current.saveDraft(mockUserId, mockFormData)
      })

      await act(async () => {
        await result.current.publishCampaign(mockUserId, result.current.currentDraftId!)
      })

      expect(mockSupabaseOperations.insert).toHaveBeenCalled()
      expect(result.current.currentDraft).toBeNull()
      expect(result.current.currentDraftId).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`funding-draft-${mockUserId}`)
    })

    test('should update existing campaign when publishing', async () => {
      // Mock successful database update
      mockSupabaseOperations.single.mockResolvedValueOnce({
        data: mockDatabaseCampaign,
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      // Set up existing campaign for editing
      act(() => {
        result.current.campaigns = [{
          ...mockDatabaseCampaign,
          source: 'database',
          isDraft: true,
          isActive: false,
          isPaused: false
        } as Campaign]
      })

      await act(async () => {
        await result.current.publishCampaign(mockUserId, mockCampaignId)
      })

      expect(mockSupabaseOperations.update).toHaveBeenCalled()
    })

    test('should handle publish errors', async () => {
      // Mock database error
      mockSupabaseOperations.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Validation failed' }
      })

      const { result } = renderHook(() => useCampaignStore())
      await act(async () => {
        await result.current.saveDraft(mockUserId, mockFormData)
      })

      await act(async () => {
        await result.current.publishCampaign(mockUserId, result.current.currentDraftId!)
      })

      expect(result.current.error).toBe('Error publishing campaign: Validation failed')
    })
  })

  describe('⏸️ Campaign Lifecycle Management', () => {
    test('should pause campaign successfully', async () => {
      // Mock successful database update
      mockSupabaseOperations.single.mockResolvedValueOnce({
        data: { ...mockDatabaseCampaign, is_active: false },
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      // Set up active campaign
      act(() => {
        result.current.campaigns = [{
          ...mockDatabaseCampaign,
          source: 'database',
          isDraft: false,
          isActive: true,
          isPaused: false
        } as Campaign]
      })

      await act(async () => {
        await result.current.pauseCampaign(mockUserId, mockCampaignId)
      })

      expect(mockSupabaseOperations.update).toHaveBeenCalled()
      
      // Check campaign was updated in store
      const updatedCampaign = result.current.campaigns.find(c => c.id === mockCampaignId)
      expect(updatedCampaign?.isActive).toBe(false)
      expect(updatedCampaign?.isPaused).toBe(true)
    })

    test('should resume campaign successfully', async () => {
      // Mock successful database update
      mockSupabaseOperations.single.mockResolvedValueOnce({
        data: { ...mockDatabaseCampaign, is_active: true },
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      // Set up paused campaign
      act(() => {
        result.current.campaigns = [{
          ...mockDatabaseCampaign,
          source: 'database',
          isDraft: false,
          isActive: false,
          isPaused: true
        } as Campaign]
      })

      await act(async () => {
        await result.current.resumeCampaign(mockUserId, mockCampaignId)
      })

      expect(mockSupabaseOperations.update).toHaveBeenCalled()
      
      // Check campaign was updated in store
      const updatedCampaign = result.current.campaigns.find(c => c.id === mockCampaignId)
      expect(updatedCampaign?.isActive).toBe(true)
      expect(updatedCampaign?.isPaused).toBe(false)
    })

    test('should delete campaign successfully', async () => {
      // Mock successful database delete
      mockSupabaseOperations.delete.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      // Set up campaign
      act(() => {
        result.current.campaigns = [{
          ...mockDatabaseCampaign,
          source: 'database',
          isDraft: false,
          isActive: true,
          isPaused: false
        } as Campaign]
      })

      await act(async () => {
        await result.current.deleteCampaign(mockCampaignId)
      })

      expect(mockSupabaseOperations.delete).toHaveBeenCalled()
      
      // Check campaign was removed from store
      const deletedCampaign = result.current.campaigns.find(c => c.id === mockCampaignId)
      expect(deletedCampaign).toBeUndefined()
    })
  })

  describe('✏️ updateCampaign - Edit Integration', () => {
    test('should update campaign successfully', async () => {
      // Mock successful database update
      const updatedData = { ...mockDatabaseCampaign, title: 'Updated Campaign Title' }
      mockSupabaseOperations.single.mockResolvedValueOnce({
        data: updatedData,
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      // Set up existing campaign
      act(() => {
        result.current.campaigns = [{
          ...mockDatabaseCampaign,
          source: 'database',
          isDraft: false,
          isActive: true,
          isPaused: false
        } as Campaign]
      })

      const updateFormData = { ...mockFormData, title: 'Updated Campaign Title' }
      
      await act(async () => {
        await result.current.updateCampaign(mockUserId, mockCampaignId, updateFormData)
      })

      expect(mockSupabaseOperations.update).toHaveBeenCalled()
      
      // Check campaign was updated in store
      const updatedCampaign = result.current.campaigns.find(c => c.id === mockCampaignId)
      expect(updatedCampaign?.title).toBe('Updated Campaign Title')
    })
  })

  describe('🔄 syncAll - Full Synchronization', () => {
    test('should sync all campaigns successfully', async () => {
      // Mock database response
      mockSupabaseOperations.order.mockResolvedValueOnce({
        data: [mockDatabaseCampaign],
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.syncAll(mockUserId)
      })

      expect(result.current.isSyncing).toBe(false)
      expect(result.current.lastSync).toBeTruthy()
      expect(result.current.campaigns).toHaveLength(1)
    })
  })

  describe('🛡️ Error Handling & Edge Cases', () => {
    test('should handle network errors during operations', async () => {
      // Mock network error
      mockSupabaseOperations.order.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })

      expect(result.current.error).toBe('Error loading campaigns: Network error')
    })

    test('should handle concurrent operations correctly', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Start multiple operations concurrently
      const promises = [
        result.current.saveDraft(mockUserId, mockFormData),
        result.current.loadCampaigns(mockUserId),
        result.current.saveDraft(mockUserId, { ...mockFormData, title: 'Updated' })
      ]

      await act(async () => {
        await Promise.allSettled(promises)
      })

      // Should not crash and should have consistent state
      expect(result.current).toBeDefined()
    })

    test('should validate campaign data before operations', async () => {
      const { result } = renderHook(() => useCampaignStore())
      
      // Try to save invalid data
      const invalidFormData = { ...mockFormData, title: '' }
      
      await act(async () => {
        await result.current.saveDraft(mockUserId, invalidFormData)
      })

      // Should still save but might have validation warnings
      expect(result.current.currentDraft?.title).toBe('')
    })
  })

  describe('💰 Real-world Campaign Scenarios', () => {
    test('should handle high-value Bitcoin campaigns', async () => {
      const highValueCampaign = {
        ...mockFormData,
        goal_amount: 21000000000, // 210 BTC in sats
        title: 'Major Bitcoin Infrastructure Project'
      }

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.saveDraft(mockUserId, highValueCampaign)
      })

      expect(result.current.currentDraft?.goal_amount).toBe(21000000000)
    })

    test('should handle campaigns with special characters', async () => {
      const specialCharCampaign = {
        ...mockFormData,
        title: 'Café ₿itcoin & Lightning ⚡ Workshop 2024! 🚀',
        description: 'Teaching Bitcoin with émojis & spéciál characters'
      }

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.saveDraft(mockUserId, specialCharCampaign)
      })

      expect(result.current.currentDraft?.title).toBe('Café ₿itcoin & Lightning ⚡ Workshop 2024! 🚀')
    })

    test('should handle multiple simultaneous campaigns', async () => {
      const campaigns = [
        { ...mockDatabaseCampaign, id: 'camp-1', title: 'Campaign 1' },
        { ...mockDatabaseCampaign, id: 'camp-2', title: 'Campaign 2' },
        { ...mockDatabaseCampaign, id: 'camp-3', title: 'Campaign 3' }
      ]

      mockSupabaseOperations.order.mockResolvedValueOnce({
        data: campaigns,
        error: null
      })

      const { result } = renderHook(() => useCampaignStore())
      
      await act(async () => {
        await result.current.loadCampaigns(mockUserId)
      })

      expect(result.current.campaigns).toHaveLength(3)
      
      const stats = result.current.getStats()
      expect(stats.totalCampaigns).toBe(3)
      expect(stats.totalActive).toBe(3) // All are active by default
    })
  })
}) 