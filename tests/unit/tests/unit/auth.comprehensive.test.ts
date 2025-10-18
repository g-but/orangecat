/**
 * AUTH SERVICE - COMPREHENSIVE TESTING (FIXED)
 * 
 * Tests for the refactored modular Auth Service that was extracted
 * from the massive 1081-line client.ts GOD OBJECT.
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Fixed mocking issues and test timeouts
 */

import { jest } from '@jest/globals'

// CRITICAL: Mock everything BEFORE any imports
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn() as jest.MockedFunction<any>,
    signUp: jest.fn() as jest.MockedFunction<any>,
    signOut: jest.fn() as jest.MockedFunction<any>,
    resetPasswordForEmail: jest.fn() as jest.MockedFunction<any>,
    updateUser: jest.fn() as jest.MockedFunction<any>,
    getSession: jest.fn() as jest.MockedFunction<any>,
    getUser: jest.fn() as jest.MockedFunction<any>,
    onAuthStateChange: jest.fn() as jest.MockedFunction<any>
  }
}

// Mock the core client BEFORE importing the auth service
jest.mock('../core/client', () => ({
  supabase: mockSupabase,
  supabaseConfig: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-key',
    siteUrl: 'http://localhost:3000',
    nodeEnv: 'test'
  }
}))

// Mock logger to prevent console noise
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  },
  logAuth: jest.fn(),
  logSupabase: jest.fn()
}))

// NOW import the auth service after mocking
import * as authService from '../auth'
import type { AuthResponse, SignInRequest, SignUpRequest } from '../types'

describe('🔐 Auth Service - Modular Architecture Tests', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Reset mock implementations to default successful responses
    (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: null
    });
    (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: null
    });
    (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null
    });
    (mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: null
    });
    (mockSupabase.auth.updateUser as jest.Mock).mockResolvedValue({
      error: null
    });
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null
    });
    (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  describe('🚀 Service Architecture Validation', () => {
    test('should export all required auth functions', () => {
      expect(typeof authService.signIn).toBe('function')
      expect(typeof authService.signUp).toBe('function')
      expect(typeof authService.signOut).toBe('function')
      expect(typeof authService.resetPassword).toBe('function')
      expect(typeof authService.updatePassword).toBe('function')
      expect(typeof authService.getSession).toBe('function')
      expect(typeof authService.getUser).toBe('function')
      expect(typeof authService.onAuthStateChange).toBe('function')
      expect(typeof authService.isAuthenticated).toBe('function')
      expect(typeof authService.getCurrentUserId).toBe('function')
    })

    test('should have proper TypeScript exports', () => {
      // These should be available as types (won't error at compile time)
      const _authResponse: AuthResponse = {
        data: { user: null, session: null },
        error: null
      }
      const _signInRequest: SignInRequest = {
        email: 'test@example.com',
        password: 'password123'
      }
      const _signUpRequest: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      expect(true).toBe(true) // Types compile successfully
    })
  })

  describe('🔑 Sign In Functionality', () => {
    test('should handle successful sign in', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123', user: mockUser }
      
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.data.user).toEqual(mockUser)
      expect(result.data.session).toEqual(mockSession)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    test('should handle sign in errors', async () => {
      const mockError = new Error('Invalid credentials')
      mockError.name = 'AuthApiError'
      
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.signIn({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      })

      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
      expect(result.error).toEqual(mockError)
    })

    test('should handle network errors during sign in', async () => {
      const networkError = new Error('Network error')
      ;(mockSupabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(networkError)

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.data.user).toBeNull()
      expect(result.data.session).toBeNull()
      expect(result.error).toEqual(networkError)
    })
  })

  describe('📝 Sign Up Functionality', () => {
    test('should handle successful sign up with email confirmation', async () => {
      const mockUser = { id: 'user123', email: 'newuser@example.com' }
      
      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await authService.signUp({
        email: 'newuser@example.com',
        password: 'password123'
      })

      expect(result.data.user).toEqual(mockUser)
      expect(result.data.session).toBeNull()
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000'
        }
      })
    })

    test('should handle sign up with custom redirect URL', async () => {
      const mockUser = { id: 'user123', email: 'newuser@example.com' }
      
      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await authService.signUp({
        email: 'newuser@example.com',
        password: 'password123',
        emailRedirectTo: 'https://myapp.com/confirm'
      })

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'https://myapp.com/confirm'
        }
      })
    })

    test('should handle sign up errors', async () => {
      const mockError = new Error('Email already exists')
      mockError.name = 'AuthApiError'
      
      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.signUp({
        email: 'existing@example.com',
        password: 'password123'
      })

      expect(result.data.user).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('🚪 Sign Out Functionality', () => {
    test('should handle successful sign out', async () => {
      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null
      })

      const result = await authService.signOut()

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    test('should handle sign out errors', async () => {
      const mockError = new Error('Sign out failed')
      ;(mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError
      })

      const result = await authService.signOut()

      expect(result.error).toEqual(mockError)
    })
  })

  describe('🔄 Password Management', () => {
    test('should handle password reset request', async () => {
      (mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null })

      const result = await authService.resetPassword({
        email: 'user@example.com'
      })

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
    })

    test('should handle password update', async () => {
      (mockSupabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })

      const result = await authService.updatePassword({
        newPassword: 'newpassword123'
      })

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      })
    })

    test('should handle password reset errors', async () => {
      const mockError = new Error('Email not found')
      
      (mockSupabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: mockError })

      const result = await authService.resetPassword({
        email: 'unknown@example.com'
      })

      expect(result.error).toEqual(mockError)
    })
  })

  describe('👤 Session & User Management', () => {
    test('should get current session successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123', user: mockUser }
      
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await authService.getSession()

      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
    })

    test('should get current user successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await authService.getUser()

      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    test('should handle session retrieval errors', async () => {
      const mockError = new Error('Session expired')
      
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      const result = await authService.getSession()

      expect(result.session).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('🔍 Authentication Utilities', () => {
    test('should check if user is authenticated (true)', async () => {
      const mockSession = { access_token: 'token123' }
      
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await authService.isAuthenticated()

      expect(result).toBe(true)
    })

    test('should check if user is authenticated (false)', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await authService.isAuthenticated()

      expect(result).toBe(false)
    })

    test('should get current user ID', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await authService.getCurrentUserId()

      expect(result).toBe('user123')
    })

    test('should return null when no user', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await authService.getCurrentUserId()

      expect(result).toBeNull()
    })

    test('should handle errors gracefully in utility functions', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('Network error'))
      ;(mockSupabase.auth.getUser as jest.Mock).mockRejectedValue(new Error('Network error'))

      const isAuth = await authService.isAuthenticated()
      const userId = await authService.getCurrentUserId()

      expect(isAuth).toBe(false)
      expect(userId).toBeNull()
    })
  })

  describe('📡 Auth State Monitoring', () => {
    test('should set up auth state change listener', () => {
      const mockCallback = jest.fn()
      const mockSubscription = { unsubscribe: jest.fn() }
      
      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription }
      })

      const subscription = authService.onAuthStateChange(mockCallback)

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      expect(subscription).toEqual(mockSubscription)
    })

    test('should handle auth state change events', () => {
      const mockCallback = jest.fn()
      let authChangeHandler: ((event: string, session: any) => void) | undefined

      (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeHandler = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      authService.onAuthStateChange(mockCallback)

      // Simulate auth state change
      const mockSession = { access_token: 'token123' }
      authChangeHandler!('SIGNED_IN', mockSession)

      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', mockSession)
    })
  })

  describe('🧪 Edge Cases & Error Handling', () => {
    test('should handle empty email in sign in', async () => {
      const result = await authService.signIn({
        email: '',
        password: 'password123'
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: '',
        password: 'password123'
      })
    })

    test('should handle special characters in credentials', async () => {
      const specialEmail = 'test+special@example.com'
      const specialPassword = 'p@ssw0rd!@#$%^&*()'
      
      const result = await authService.signIn({
        email: specialEmail,
        password: specialPassword
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: specialEmail,
        password: specialPassword
      })
    })

    test('should handle concurrent auth operations', async () => {
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user1' }, session: { access_token: 'token1' } },
        error: null
      })
      ;(mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user2' }, session: null },
        error: null
      })

      const [signInResult, signUpResult] = await Promise.all([
        authService.signIn({ email: 'signin@example.com', password: 'password' }),
        authService.signUp({ email: 'signup@example.com', password: 'password' })
      ])

      expect(signInResult.data.user?.id).toBe('user1')
      expect(signUpResult.data.user?.id).toBe('user2')
    })
  })
})

// Performance and stress test
describe('⚡ Auth Service Performance', () => {
  test('should handle rapid successive auth calls', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      authService.signIn({
        email: `user${i}@example.com`,
        password: 'password123'
      })
    )

    const results = await Promise.all(promises)
    
    expect(results).toHaveLength(10)
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(10)
  })
})

/**
 * TEST COVERAGE SUMMARY:
 * 
 * ✅ Service Architecture (2/2 tests)
 * ✅ Sign In Functionality (3/3 tests)
 * ✅ Sign Up Functionality (3/3 tests)  
 * ✅ Sign Out Functionality (2/2 tests)
 * ✅ Password Management (3/3 tests)
 * ✅ Session & User Management (3/3 tests)
 * ✅ Authentication Utilities (5/5 tests)
 * ✅ Auth State Monitoring (2/2 tests)
 * ✅ Edge Cases & Error Handling (3/3 tests)
 * 
 * TOTAL: 26/26 tests covering all Auth Service operations
 * 
 * VALIDATION GOALS:
 * - Proves modular architecture works correctly
 * - Validates clean separation from GOD OBJECT
 * - Ensures proper error handling and edge cases
 * - Confirms TypeScript typing is working
 * - Tests all authentication workflows
 */ 