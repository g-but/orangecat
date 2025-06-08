/**
 * SIMPLIFIED CAMPAIGN SERVICE TESTS - WORKING INFRASTRUCTURE
 * 
 * This test suite focuses on core business logic with working mocks
 * Tests the most critical user flows for Bitcoin campaign platform
 */

// Mock Supabase first
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn()
}))

import { CampaignService } from '../index'

describe('🚀 CampaignService - Working Infrastructure Tests', () => {
  let campaignService: CampaignService
  let mockSupabase: any
  let localStorageMock: Record<string, string>
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

  describe('📊 Core Campaign Loading', () => {
    it('should load campaigns successfully', async () => {
      const campaigns = await campaignService.getAllCampaigns(userId)

      expect(campaigns).toHaveLength(1)
      expect(campaigns[0].title).toBe('Test Campaign')
      expect(campaigns[0].source).toBe('database')
      expect(campaigns[0].isDraft).toBe(true) // is_active: false, is_public: false
      expect(mockSupabase.from).toHaveBeenCalledWith('funding_pages')
    })

    it('should handle database errors', async () => {
      // Setup error mock
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: null, error: new Error('Database error') }))
          }))
        }))
      })

      await expect(campaignService.getAllCampaigns(userId)).rejects.toThrow('Database error')
    })

    it('should merge local drafts with database campaigns', async () => {
      // Set up local draft
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify({
        formData: { title: 'Local Draft', description: 'Local description' },
        currentStep: 2,
        draftId: campaignId,
        lastSaved: new Date().toISOString()
      })

      const campaigns = await campaignService.getAllCampaigns(userId)

      // Should use local data over database
      expect(campaigns).toHaveLength(1)
      expect(campaigns[0].title).toBe('Local Draft')
      expect(campaigns[0].source).toBe('local')
    })
  })

  describe('💾 Draft Management', () => {
    it('should save draft locally and to database', async () => {
      const draftId = await campaignService.saveDraft(userId, formData, 1)

      // Check database was called
      expect(mockSupabase.from).toHaveBeenCalledWith('funding_pages')
      expect(draftId).toBe(campaignId)
      
      // Check localStorage was updated
      expect(Storage.prototype.setItem).toHaveBeenCalled()
      const savedData = JSON.parse(localStorageMock[`funding-draft-${userId}`])
      expect(savedData.formData.title).toBe(formData.title)
    })

    it('should handle malformed data gracefully', async () => {
      const malformedData = {
        ...formData,
        goal_amount: 'invalid-number' as any
      }

      // This should not throw an error
      await expect(campaignService.saveDraft(userId, malformedData, 1)).resolves.toBeDefined()

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          goal_amount: null // Should convert invalid numbers to null
        })
      )
    })
  })

  describe('🚀 Campaign Publishing', () => {
    it('should publish campaign successfully', async () => {
      const publishedCampaign = await campaignService.publishCampaign(userId, campaignId, formData)

      expect(publishedCampaign.isActive).toBe(true)
      expect(publishedCampaign.isDraft).toBe(false)
      expect(mockSupabase.from).toHaveBeenCalledWith('funding_pages')
    })

    it('should clear local draft after publish', async () => {
      // Set up local draft
      localStorageMock[`funding-draft-${userId}`] = JSON.stringify({ formData })

      await campaignService.publishCampaign(userId, campaignId, formData)

      // Local draft should be cleared
      expect(localStorageMock[`funding-draft-${userId}`]).toBeUndefined()
    })
  })

  describe('🔍 Campaign Filtering', () => {
    it('should filter campaigns by status', async () => {
      const campaigns = [
        { ...mockDbCampaign, id: '1', is_active: false, is_public: false, isDraft: true, isActive: false, isPaused: false, source: 'database' as const },
        { ...mockDbCampaign, id: '2', is_active: true, is_public: true, isDraft: false, isActive: true, isPaused: false, source: 'database' as const },
        { ...mockDbCampaign, id: '3', is_active: false, is_public: true, isDraft: false, isActive: false, isPaused: true, source: 'database' as const }
      ]

      const drafts = await campaignService.filterCampaigns(campaigns, { status: 'draft' })
      const active = await campaignService.filterCampaigns(campaigns, { status: 'active' })
      const paused = await campaignService.filterCampaigns(campaigns, { status: 'paused' })

      expect(drafts).toHaveLength(1)
      expect(active).toHaveLength(1)
      expect(paused).toHaveLength(1)
      expect(drafts[0].isDraft).toBe(true)
      expect(active[0].isActive).toBe(true)
      expect(paused[0].isPaused).toBe(true)
    })
  })

  describe('🛠️ Local Storage Management', () => {
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

    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock[`funding-draft-${userId}`] = 'invalid-json-data'

      const localDraft = campaignService.getLocalDraft(userId)
      expect(localDraft).toBe(null)
    })
  })

  describe('⚠️ Error Handling', () => {
    it('should handle empty user ID', async () => {
      await expect(campaignService.getAllCampaigns('')).rejects.toThrow('User ID is required')
    })

    it('should handle null form data', async () => {
      await expect(campaignService.saveDraft(userId, null as any, 1)).rejects.toThrow('Form data is required')
    })
  })
}) 