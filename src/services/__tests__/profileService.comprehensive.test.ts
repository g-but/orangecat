/**
 * PROFILE SERVICE - COMPREHENSIVE TEST COVERAGE
 * 
 * This test suite provides comprehensive coverage for the ProfileService,
 * testing all user profile operations, authentication flows, error handling,
 * fallback mechanisms, and edge cases.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Comprehensive ProfileService tests with fallback testing
 */

// Mock Supabase client
jest.mock('@/services/supabase/client', () => ({
  __esModule: true,
  default: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      updateUser: jest.fn()
    },
    rpc: jest.fn()
  }
}))

// Mock dependencies
jest.mock('@/stores/auth', () => ({
  useAuthStore: jest.fn()
}))

jest.mock('@/services/supabase/profiles', () => ({
  updateProfile: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('@/utils/logger', () => ({
  logProfile: jest.fn(),
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}))

// Import after mocking
import { ProfileService } from '../profileService'
import supabase from '@/services/supabase/client'

interface ProfileFormData {
  username?: string
  display_name?: string | null
  bio?: string | null
  bitcoin_address?: string | null
  avatar_url?: string | null
  banner_url?: string | null
}

// Get the mocked supabase client
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('👤 Profile Service - Comprehensive Coverage', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset default behaviors
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    mockSupabase.auth.updateUser.mockResolvedValue({
      error: null
    })

    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC not available' }
    })
  })

  describe('🎯 Service Architecture', () => {
    
    test('should export ProfileService class', () => {
      expect(ProfileService).toBeDefined()
      expect(typeof ProfileService).toBe('function')
    })

    test('should have all required static methods', () => {
      expect(typeof ProfileService.getProfile).toBe('function')
      expect(typeof ProfileService.updateProfile).toBe('function')
      expect(typeof ProfileService.createProfile).toBe('function')
      expect(typeof ProfileService.updatePassword).toBe('function')
      expect(typeof ProfileService.fallbackProfileUpdate).toBe('function')
    })

  })

  describe('👤 Get Profile Operations', () => {
    
    test('should retrieve profile successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        bio: 'Test bio',
        bitcoin_address: 'bc1qtest',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: mockProfile, 
              error: null 
            }))
          }))
        }))
      })

      const result = await ProfileService.getProfile('user-123')

      expect(result).toEqual(mockProfile)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    test('should handle profile not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { code: 'PGRST116', message: 'Profile not found' } 
            }))
          }))
        }))
      })

      const result = await ProfileService.getProfile('nonexistent-user')

      expect(result).toBeNull()
    })

    test('should handle database connection errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('Connection failed')))
          }))
        }))
      })

      const result = await ProfileService.getProfile('user-123')

      expect(result).toBeNull()
    })

    test('should handle empty user ID gracefully', async () => {
      const result = await ProfileService.getProfile('')

      expect(result).toBeNull()
    })

    test('should handle malformed user IDs', async () => {
      const invalidUserIds = ['null', 'undefined', '{}', '[]', '   ', 'user with spaces']
      
      for (const invalidId of invalidUserIds) {
        const result = await ProfileService.getProfile(invalidId)
        expect(result).toBeNull()
      }
    })

  })

  describe('✏️ Update Profile Operations', () => {
    
    test('should update profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockUpdatedProfile = {
        id: 'user-123',
        username: 'newusername',
        display_name: 'New Name',
        bio: 'Updated bio',
        updated_at: expect.any(String)
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: mockUpdatedProfile, 
                error: null 
              }))
            }))
          }))
        }))
      })

      const formData: ProfileFormData = {
        username: 'newusername',
        display_name: 'New Name',
        bio: 'Updated bio'
      }

      const result = await ProfileService.updateProfile('user-123', formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedProfile)
      expect(result.error).toBeUndefined()
    })

    test('should validate user ID is required', async () => {
      const formData: ProfileFormData = {
        username: 'testuser'
      }

      const result = await ProfileService.updateProfile('', formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User ID is required')
    })

    test('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const formData: ProfileFormData = {
        username: 'testuser'
      }

      const result = await ProfileService.updateProfile('user-123', formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No authenticated user. Please log in again.')
    })

    test('should enforce user permission check', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const formData: ProfileFormData = {
        username: 'testuser'
      }

      const result = await ProfileService.updateProfile('user-123', formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission denied: You can only update your own profile')
    })

    test('should handle username uniqueness constraint', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: null, 
                error: { 
                  code: '23505', 
                  message: 'duplicate key value violates unique constraint' 
                } 
              }))
            }))
          }))
        }))
      })

      const formData: ProfileFormData = {
        username: 'existinguser'
      }

      const result = await ProfileService.updateProfile('user-123', formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username is already taken. Please choose another username.')
    })

    test('should handle missing avatar_url column with fallback', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockUpdatedProfile = {
        id: 'user-123',
        username: 'testuser'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      let callCount = 0
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => {
                callCount++
                if (callCount === 1) {
                  return Promise.resolve({ 
                    data: null, 
                    error: { 
                      code: 'PGRST204', 
                      message: "Could not find the 'avatar_url' column" 
                    } 
                  })
                } else {
                  return Promise.resolve({ 
                    data: mockUpdatedProfile, 
                    error: null 
                  })
                }
              })
            }))
          }))
        }))
      })

      const formData: ProfileFormData = {
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg'
      }

      const result = await ProfileService.updateProfile('user-123', formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUpdatedProfile)
      expect(result.warning).toContain('avatar_url column')
    })

  })

  describe('➕ Create Profile Operations', () => {
    
    test('should create new profile successfully', async () => {
      const mockNewProfile = {
        id: 'user-123',
        username: 'newuser',
        display_name: 'New User',
        bio: 'New user bio',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: null 
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: mockNewProfile, 
              error: null 
            }))
          }))
        }))
      })

      const formData: ProfileFormData = {
        username: 'newuser',
        display_name: 'New User',
        bio: 'New user bio'
      }

      const result = await ProfileService.createProfile('user-123', formData)

      expect(result.success).toBe(true)
    })

    test('should handle existing profile with upsert', async () => {
      const mockExistingProfile = {
        id: 'user-123'
      }

      const mockUpdatedProfile = {
        id: 'user-123',
        username: 'updateduser',
        display_name: 'Updated User'
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({ 
              data: mockExistingProfile, 
              error: null 
            }))
          }))
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: mockUpdatedProfile, 
              error: null 
            }))
          }))
        }))
      })

      const formData: ProfileFormData = {
        username: 'updateduser',
        display_name: 'Updated User'
      }

      const result = await ProfileService.createProfile('user-123', formData)

      expect(result.success).toBe(true)
    })

  })

  describe('🔐 Password Update Operations', () => {
    
    test('should update password successfully', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: null
      })

      const result = await ProfileService.updatePassword('newSecurePassword123!')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newSecurePassword123!'
      })
    })

    test('should handle weak password errors', async () => {
      const error = new Error('Password should be at least 6 characters')
      mockSupabase.auth.updateUser.mockRejectedValue(error)

      const result = await ProfileService.updatePassword('weak')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Password should be at least 6 characters')
    })

    test('should handle authentication errors', async () => {
      const error = new Error('Invalid authentication credentials')
      mockSupabase.auth.updateUser.mockRejectedValue(error)

      const result = await ProfileService.updatePassword('newpassword123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid authentication credentials')
    })

    test('should handle network errors', async () => {
      mockSupabase.auth.updateUser.mockRejectedValue(new Error('Network connection failed'))

      const result = await ProfileService.updatePassword('newpassword123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network connection failed')
    })

  })

  describe('🔄 Fallback Profile Update', () => {
    
    test('should attempt RPC fallback method', async () => {
      const updates = {
        username: 'testuser',
        display_name: 'Test User'
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { id: 'user-123' }, 
              error: null 
            }))
          }))
        }))
      })

      mockSupabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null
      })

      const result = await ProfileService.fallbackProfileUpdate('user-123', updates)

      expect(result.success).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_profile', { profile_data: updates })
    })

    test('should handle all fallback methods failing', async () => {
      const updates = {
        username: 'testuser'
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { id: 'user-123' }, 
              error: null 
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'All attempts failed' } 
            }))
          }))
        }))
      })

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' }
      })

      const result = await ProfileService.fallbackProfileUpdate('user-123', updates)

      expect(result.success).toBe(false)
      expect(result.error).toContain('All profile update methods failed')
    })

  })

  describe('🧪 Edge Cases & Error Recovery', () => {
    
    test('should handle special characters in profile data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { id: 'user-123' }, 
                error: null 
              }))
            }))
          }))
        }))
      })

      const formData: ProfileFormData = {
        username: 'user_with-special.chars',
        display_name: 'User with émojis 🚀💰',
        bio: 'Bio with "quotes", <tags>, and [brackets]',
        bitcoin_address: 'bc1qspecial123'
      }

      const result = await ProfileService.updateProfile('user-123', formData)

      expect(result.success).toBe(true)
    })

    test('should handle concurrent profile operations', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { id: 'user-123' }, 
                error: null 
              }))
            }))
          }))
        }))
      })

      const formData: ProfileFormData = {
        username: 'testuser',
        display_name: 'Test User'
      }

      // Simulate concurrent operations
      const promises = Array.from({ length: 5 }, (_, i) => 
        ProfileService.updateProfile('user-123', {
          ...formData,
          bio: `Concurrent update ${i}`
        })
      )

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

  })

}) 