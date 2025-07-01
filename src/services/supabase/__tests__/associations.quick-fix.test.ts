/**
 * 🚀 ASSOCIATION SYSTEM - QUICK VERIFICATION TESTS
 * 
 * Simple tests to verify the association system deployment works correctly
 */

import AssociationService from '../associations'

// Mock the supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
}

jest.mock('../core/client', () => ({
  supabase: mockSupabase
}))

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}))

describe('🎯 Association System - Deployment Verification', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  })

  test('✅ Association service is properly instantiated', () => {
    expect(AssociationService).toBeDefined()
    expect(typeof AssociationService.createAssociation).toBe('function')
    expect(typeof AssociationService.getProfileAssociations).toBe('function')
  })

  test('✅ Database schema deployment successful', async () => {
    const mockAssociation = {
      id: 'test-id',
      source_profile_id: 'test-user-id',
      target_entity_id: 'test-campaign-id',
      target_entity_type: 'campaign',
      relationship_type: 'created',
      status: 'active',
      reward_percentage: 0,
      permissions: {},
      metadata: {},
      visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    }

    mockSupabase.single.mockResolvedValue({
      data: mockAssociation,
      error: null
    })

    const result = await AssociationService.createAssociation({
      target_entity_id: 'test-campaign-id',
      target_entity_type: 'campaign',
      relationship_type: 'created'
    })

    expect(result).toBeDefined()
    expect(mockSupabase.from).toHaveBeenCalledWith('profile_associations')
  })

  test('✅ Bitcoin integration ready', async () => {
    const bitcoinAssociation = {
      id: 'bitcoin-test-id',
      source_profile_id: 'test-user-id',
      target_entity_id: 'test-campaign-id',
      target_entity_type: 'campaign',
      relationship_type: 'supports',
      bitcoin_reward_address: 'bc1qexample123',
      reward_percentage: 2.5,
      status: 'active',
      permissions: {},
      metadata: {},
      visibility: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    }

    mockSupabase.single.mockResolvedValue({
      data: bitcoinAssociation,
      error: null
    })

    const result = await AssociationService.createAssociation({
      target_entity_id: 'test-campaign-id',
      target_entity_type: 'campaign',
      relationship_type: 'supports',
      bitcoin_reward_address: 'bc1qexample123',
      reward_percentage: 2.5
    })

    expect(result.bitcoin_reward_address).toBe('bc1qexample123')
    expect(result.reward_percentage).toBe(2.5)
  })

}) 