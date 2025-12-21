/**
 * Campaign Service Integration Tests - FIXED MOCKING INFRASTRUCTURE
 * 
 * CRITICAL BUSINESS LOGIC COVERAGE for Bitcoin Campaign Platform
 * Testing core campaign creation, management, and publishing flows
 * 
 * INFRASTRUCTURE FIXES:
 * - Proper dependency injection for Supabase client
 * - Comprehensive mock chain patterns
 * - Isolated test environment
 */

// Mock the createBrowserClient factory function
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn()
}))

import { CampaignService } from '../index'
import { createBrowserClient } from '@supabase/ssr'

describe('🚀 CampaignService - Comprehensive Coverage', () => {
  let campaignService: CampaignService
  let localStorageMock: Record<string, string>
  let mockSupabase: any
  let mockInsert: jest.Mock
  let mockUpdate: jest.Mock

  const userId = 'test-user-123'
  const campaignId = 'campaign-456'
  
  const mockDbCampaign = {
    id: campaignId,
    user_id: userId,
    title: 'Test Campaign',
    description: 'Test Description',
    bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    lightning_address: 'test@getalby.com',
    website_url: 'https://example.com',
    goal_amount: 50000,
    category: 'technology',
    tags: ['bitcoin'],
    currency: 'BTC',
    is_active: false,
    is_public: false,
    total_funding: 0,
    contributor_count: 0,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  const formData = {
    title: 'Test Campaign',
    description: 'Test Description',
    bitcoin_address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    lightning_address: 'test@getalby.com',
    website_url: 'https://example.com',
    goal_amount: 50000,
    categories: ['technology', 'bitcoin']
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup localStorage mock
    localStorageMock = {}
    Storage.prototype.getItem = jest.fn((key) => localStorageMock[key] || null)
    Storage.prototype.setItem = jest.fn((key, value) => {
      localStorageMock[key] = value
    })
    Storage.prototype.removeItem = jest.fn((key) => {
      delete localStorageMock[key]
    })

    // Create mock functions that we can track
    mockInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockDbCampaign, error: null }))
      }))
    }))

    mockUpdate = jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: {...mockDbCampaign, is_active: true, is_public: true}, error: null }))
          }))
        }))
      }))
    }))

    // Setup mock Supabase with working chains
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [mockDbCampaign], error: null })),
            single: jest.fn(() => Promise.resolve({ data: mockDbCampaign, error: null }))
          }))
        })),
        insert: mockInsert,
        update: mockUpdate
      }))
    }

    campaignService = new CampaignService(mockSupabase)
  })

  describe('📊 Campaign Loading - Critical User Flow', () => {
    it('should load campaigns from database successfully', async () => {
      const mockCampaigns = [mockDbCampaign]
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
          }))
        }))
      })

      const campaigns = await campaignService.getAllCampaigns(userId)

      expect(campaigns).toHaveLength(1)
      expect(campaigns[0].source).toBe('database')
      expect(campaigns[0].isDraft).toBe(true) // is_active: false, is_public: false
      expect(mockSupabase.from).toHaveBeenCalledWith('funding_pages')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: null, error: new Error('Database connection failed') }))
          }))
        }))
      })

      await expect(campaignService.getAllCampaigns(userId)).rejects.toThrow('Database connection failed')
    })

    it('should merge local drafts with database campaigns', async () => {
      // Set up local draft
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify({
        formData: { title: 'Local Draft', description: 'Local description' },
        currentStep: 2,
        draftId: campaignId,
        lastSaved: new Date().toISOString()
      })

      const mockCampaigns = [mockDbCampaign]
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
          }))
        }))
      })

      const campaigns = await campaignService.getAllCampaigns(userId)

      // Should merge local draft with database version
      expect(campaigns).toHaveLength(1)
      expect(campaigns[0].title).toBe('Local Draft') // Local takes priority
      expect(campaigns[0].source).toBe('local')
    })
  })

  describe('💾 Draft Saving - Data Integrity Critical', () => {
    it('should save draft to localStorage immediately', async () => {
      await campaignService.saveDraft(userId, formData, 1)

      // Check localStorage was called
      expect(Storage.prototype.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(localStorageMock[`funding-draft-${userId}`])
      expect(savedData.formData.title).toBe(formData.title)
      expect(savedData.currentStep).toBe(1)
    })

    it('should create new draft in database', async () => {
      const draftId = await campaignService.saveDraft(userId, formData, 1)

      expect(draftId).toBe(campaignId)
      expect(mockSupabase.from).toHaveBeenCalledWith('funding_pages')
      
      // Verify insert was called with correct data
      const insertCall = mockSupabase.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          title: formData.title,
          is_active: false,
          is_public: false
        })
      )
    })

    it('should update existing draft in database', async () => {
      const existingDraftId = 'existing-123'
      
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockDbCampaign, error: null }))
              }))
            }))
          }))
        }))
      })

      await campaignService.saveDraft(userId, formData, 2, existingDraftId)

      const updateCall = mockSupabase.from().update
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          title: formData.title,
          description: formData.description
        })
      )
    })

    it('should handle draft save errors without losing local data', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: new Error('Network error') }))
          }))
        }))
      })

      await expect(campaignService.saveDraft(userId, formData, 1)).rejects.toThrow('Network error')

      // But local data should still be saved
      const savedDraft = JSON.parse(localStorageMock[`funding-draft-${userId}`] || '{}')
      expect(savedDraft.formData?.title).toBe(formData.title)
    })

    it('should handle malformed goal amounts', async () => {
      const malformedData = {
        ...formData,
        goal_amount: 'invalid-number' as any
      }

      await campaignService.saveDraft(userId, malformedData, 1)

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          goal_amount: null // Should convert invalid numbers to null
        })
      )
    })
  })

  describe('🚀 Campaign Publishing - Business Critical', () => {
    it('should publish campaign successfully', async () => {
      const publishedCampaign = await campaignService.publishCampaign(userId, campaignId, formData)

      expect(publishedCampaign.isActive).toBe(true)
      expect(publishedCampaign.isDraft).toBe(false)
      expect(publishedCampaign.isPaused).toBe(false)
      
      const updateCall = mockSupabase.from().update
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          is_public: true
        })
      )
    })

    it('should clear local draft after successful publish', async () => {
      // Set up local draft
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify({ formData })

      await campaignService.publishCampaign(userId, campaignId, formData)

      // Local draft should be cleared
      expect(localStorageMock[`funding-draft-${userId}`]).toBeUndefined()
    })

    it('should handle publish errors without clearing local draft', async () => {
      // Set up local draft
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify({ formData })

      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: null, error: new Error('Publish failed') }))
              }))
            }))
          }))
        }))
      })

      await expect(campaignService.publishCampaign(userId, campaignId, {})).rejects.toThrow('Publish failed')

      // Local draft should be preserved
      expect(localStorageMock[`funding-draft-${userId}`]).not.toBeNull()
    })
  })

  describe('🔍 Campaign Filtering - User Experience', () => {
    it('should filter drafts correctly', async () => {
      const mockCampaigns = [
        { ...mockDbCampaign, id: '1', is_active: false, is_public: false },
        { ...mockDbCampaign, id: '2', is_active: true, is_public: true },
        { ...mockDbCampaign, id: '3', is_active: false, is_public: true }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
          }))
        }))
      })

      const campaigns = await campaignService.getAllCampaigns(userId)
      const filtered = await campaignService.filterCampaigns(campaigns, { status: 'draft' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].isDraft).toBe(true)
    })

    it('should filter active campaigns correctly', async () => {
      const mockCampaigns = [
        { ...mockDbCampaign, id: '1', is_active: false, is_public: false },
        { ...mockDbCampaign, id: '2', is_active: true, is_public: true },
        { ...mockDbCampaign, id: '3', is_active: false, is_public: true }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
          }))
        }))
      })

      const campaigns = await campaignService.getAllCampaigns(userId)
      const filtered = await campaignService.filterCampaigns(campaigns, { status: 'active' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].isActive).toBe(true)
    })

    it('should filter paused campaigns correctly', async () => {
      const mockCampaigns = [
        { ...mockDbCampaign, id: '1', is_active: false, is_public: false },
        { ...mockDbCampaign, id: '2', is_active: true, is_public: true },
        { ...mockDbCampaign, id: '3', is_active: false, is_public: true }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
          }))
        }))
      })

      const campaigns = await campaignService.getAllCampaigns(userId)
      const filtered = await campaignService.filterCampaigns(campaigns, { status: 'paused' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].isPaused).toBe(true)
    })

    it('should return all campaigns when filter is "all"', async () => {
      const mockCampaigns = [
        { ...mockDbCampaign, id: '1', is_active: false, is_public: false },
        { ...mockDbCampaign, id: '2', is_active: true, is_public: true }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockCampaigns, error: null }))
          }))
        }))
      })

      const campaigns = await campaignService.getAllCampaigns(userId)
      const filtered = await campaignService.filterCampaigns(campaigns, { status: 'all' })

      expect(filtered).toHaveLength(2)
    })
  })

  describe('🛠️ Local Draft Management - Data Safety', () => {
    it('should detect local draft existence', () => {
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify({ formData })

      const hasLocalDraft = campaignService.hasLocalDraft(userId)
      expect(hasLocalDraft).toBe(true)
    })

    it('should retrieve local draft correctly', () => {
      const draftData = { formData, currentStep: 2 }
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify(draftData)

      const localDraft = campaignService.getLocalDraft(userId)
      expect(localDraft).toBeTruthy()
      expect(localDraft?.formData.title).toBe(formData.title)
      expect(localDraft?.currentStep).toBe(2)
    })

    it('should clear local draft completely', () => {
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify({ formData })

      campaignService.clearLocalDraft(userId)
      expect(localStorageMock[`funding-draft-${userId}`]).toBeUndefined()
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock[`funding-draft-${userId}`] = 'invalid-json-data'

      const localDraft = campaignService.getLocalDraft(userId)
      expect(localDraft).toBe(null)
    })
  })

  describe('⚠️ Edge Cases and Error Scenarios', () => {
    it('should handle empty user ID', async () => {
      await expect(campaignService.getAllCampaigns('')).rejects.toThrow('User ID is required')
    })

    it('should handle null/undefined form data', async () => {
      await expect(campaignService.saveDraft(userId, null as any, 1)).rejects.toThrow()
    })

    it('should handle network timeouts gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.reject(new Error('Network timeout')))
          }))
        }))
      })

      await expect(campaignService.getAllCampaigns(userId)).rejects.toThrow('Network timeout')
    })

    it('should maintain data consistency during concurrent saves', async () => {
      const promises = [
        campaignService.saveDraft(userId, formData, 1),
        campaignService.saveDraft(userId, formData, 2)
      ]

      // Both should complete without interfering with each other
      const results = await Promise.allSettled(promises)
      expect(results.every(r => r.status === 'fulfilled')).toBe(true)
    })
  })

  describe('🔧 Singleton Pattern - Memory Management', () => {
    it('should always return the same instance', () => {
      const instance1 = CampaignService.getInstance()
      const instance2 = CampaignService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })
})