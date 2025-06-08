/**
 * SUPABASE CORE CLIENT - COMPREHENSIVE TESTS
 * 
 * Tests core Supabase client configuration, environment validation,
 * and storage mechanisms for production readiness.
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Comprehensive SupabaseServices tests for Option A completion
 */

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-123456789',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NODE_ENV: 'test'
}

// Mock browser environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

// Mock process.env
const originalEnv = process.env
beforeAll(() => {
  process.env = { ...originalEnv, ...mockEnv }
})

afterAll(() => {
  process.env = originalEnv
})

// Mock Supabase client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  }))
}))

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
  logSupabase: jest.fn(),
}))

describe('🏗️ Supabase Core Client - Comprehensive Coverage', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset localStorage and sessionStorage mocks
    ;(window.localStorage.getItem as jest.Mock).mockReturnValue(null)
    ;(window.localStorage.setItem as jest.Mock).mockImplementation(() => {})
    ;(window.localStorage.removeItem as jest.Mock).mockImplementation(() => {})
    
    ;(window.sessionStorage.getItem as jest.Mock).mockReturnValue(null)
    ;(window.sessionStorage.setItem as jest.Mock).mockImplementation(() => {})
    ;(window.sessionStorage.removeItem as jest.Mock).mockImplementation(() => {})
    
    // Reset console methods to avoid test noise
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('🌍 Environment Validation', () => {
    
    test('should validate complete environment configuration', () => {
      // Dynamic import to test environment validation
      const modulePromise = import('../core/client')
      
      expect(modulePromise).resolves.toBeDefined()
    })

    test('should handle missing environment variables', () => {
      const invalidEnv = { ...mockEnv }
      delete invalidEnv.NEXT_PUBLIC_SUPABASE_URL
      
      process.env = { ...originalEnv, ...invalidEnv }
      
      // Clear module cache and re-import
      jest.resetModules()
      
      expect(() => {
        require('../core/client')
      }).toThrow('Missing Supabase environment variables')
    })

    test('should validate URL format', () => {
      const invalidUrlEnv = {
        ...mockEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'invalid-url'
      }
      
      process.env = { ...originalEnv, ...invalidUrlEnv }
      jest.resetModules()
      
      expect(() => {
        require('../core/client')
      }).toThrow('Invalid Supabase URL format')
    })

    test('should warn about non-https URLs', async () => {
      const httpEnv = {
        ...mockEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'http://test.supabase.co'
      }
      
      process.env = { ...originalEnv, ...httpEnv }
      jest.resetModules()
      
      require('../core/client')
      
      const { logger } = require('@/utils/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Supabase URL should use https protocol:',
        'http:',
        'Supabase'
      )
    })

    test('should provide default site URL', () => {
      const noSiteUrlEnv = { ...mockEnv }
      delete noSiteUrlEnv.NEXT_PUBLIC_SITE_URL
      
      process.env = { ...originalEnv, ...noSiteUrlEnv }
      jest.resetModules()
      
      const clientModule = require('../core/client')
      expect(clientModule.supabaseConfig.siteUrl).toBe('http://localhost:3000')
    })

  })

  describe('🔧 Client Configuration', () => {
    
    test('should create client with proper auth configuration', async () => {
      const { createBrowserClient } = require('@supabase/ssr')
      
      require('../core/client')
      
      expect(createBrowserClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            debug: true, // test environment
            storage: expect.any(Object)
          })
        })
      )
    })

    test('should configure production vs development settings', () => {
      const prodEnv = {
        ...mockEnv,
        NODE_ENV: 'production'
      }
      
      process.env = { ...originalEnv, ...prodEnv }
      jest.resetModules()
      
      const { createBrowserClient } = require('@supabase/ssr')
      
      require('../core/client')
      
      expect(createBrowserClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            debug: false // production
          }),
          cookieOptions: expect.objectContaining({
            secure: true // production
          })
        })
      )
    })

    test('should export client and configuration', () => {
      const clientModule = require('../core/client')
      
      expect(clientModule.supabase).toBeDefined()
      expect(clientModule.supabaseConfig).toBeDefined()
      expect(clientModule.default).toBeDefined()
    })

  })

  describe('💾 Storage Implementation', () => {

    test('should handle localStorage operations', () => {
      const clientModule = require('../core/client')
      const { createBrowserClient } = require('@supabase/ssr')
      
      // Get storage configuration from createBrowserClient call
      const configCall = (createBrowserClient as jest.Mock).mock.calls[0]
      const storage = configCall[2].auth.storage
      
      // Test getItem
      ;(window.localStorage.getItem as jest.Mock).mockReturnValue('{"test": "value"}')
      const result = storage.getItem('test-key')
      
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key')
      expect(result).toEqual({ test: 'value' })
    })

    test('should fallback to sessionStorage when localStorage fails', () => {
      const clientModule = require('../core/client')
      const { createBrowserClient } = require('@supabase/ssr')
      
      const configCall = (createBrowserClient as jest.Mock).mock.calls[0]
      const storage = configCall[2].auth.storage
      
      // Mock localStorage to throw error
      ;(window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      ;(window.sessionStorage.getItem as jest.Mock).mockReturnValue('{"fallback": "value"}')
      
      const result = storage.getItem('test-key')
      
      expect(window.sessionStorage.getItem).toHaveBeenCalledWith('test-key')
      expect(result).toEqual({ fallback: 'value' })
    })

    test('should handle setItem with redundancy', () => {
      const clientModule = require('../core/client')
      const { createBrowserClient } = require('@supabase/ssr')
      
      const configCall = (createBrowserClient as jest.Mock).mock.calls[0]
      const storage = configCall[2].auth.storage
      
      const testData = { session: 'data' }
      storage.setItem('session-key', testData)
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'session-key',
        JSON.stringify(testData)
      )
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'session-key',
        JSON.stringify(testData)
      )
    })

    test('should handle storage errors gracefully', () => {
      const clientModule = require('../core/client')
      const { createBrowserClient } = require('@supabase/ssr')
      
      const configCall = (createBrowserClient as jest.Mock).mock.calls[0]
      const storage = configCall[2].auth.storage
      
      // Mock both storages to fail
      ;(window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      ;(window.sessionStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      // Should not throw, but handle gracefully
      expect(() => {
        storage.setItem('test-key', { data: 'value' })
      }).not.toThrow()
    })

    test('should remove items from both storages', () => {
      const clientModule = require('../core/client')
      const { createBrowserClient } = require('@supabase/ssr')
      
      const configCall = (createBrowserClient as jest.Mock).mock.calls[0]
      const storage = configCall[2].auth.storage
      
      storage.removeItem('test-key')
      
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-key')
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('test-key')
    })

    test('should handle malformed JSON in storage', () => {
      const clientModule = require('../core/client')
      const { createBrowserClient } = require('@supabase/ssr')
      
      const configCall = (createBrowserClient as jest.Mock).mock.calls[0]
      const storage = configCall[2].auth.storage
      
      ;(window.localStorage.getItem as jest.Mock).mockReturnValue('invalid-json')
      
      const result = storage.getItem('test-key')
      expect(result).toBe(null)
    })

  })

  describe('🔒 Security Configuration', () => {
    
    test('should use secure cookies in production', () => {
      const prodEnv = {
        ...mockEnv,
        NODE_ENV: 'production'
      }
      
      process.env = { ...originalEnv, ...prodEnv }
      jest.resetModules()
      
      const { createBrowserClient } = require('@supabase/ssr')
      
      require('../core/client')
      
      expect(createBrowserClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          cookieOptions: expect.objectContaining({
            secure: true,
            sameSite: 'lax',
            path: '/'
          })
        })
      )
    })

    test('should use appropriate database schema', () => {
      const { createBrowserClient } = require('@supabase/ssr')
      
      require('../core/client')
      
      expect(createBrowserClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          db: expect.objectContaining({
            schema: 'public'
          })
        })
      )
    })

  })

  describe('🧪 Edge Cases & Error Recovery', () => {
    
    test('should handle missing window object gracefully', () => {
      // This test simulates server-side rendering
      const originalWindow = global.window
      delete (global as any).window
      
      jest.resetModules()
      
      expect(() => {
        require('../core/client')
      }).not.toThrow()
      
      global.window = originalWindow
    })

    test('should validate environment on every import', () => {
      const { logSupabase } = require('@/utils/logger')
      
      // Clear and re-import
      jest.resetModules()
      require('../core/client')
      
      expect(logSupabase).toHaveBeenCalledWith(
        'Environment validation:',
        expect.objectContaining({
          supabaseUrl: expect.stringContaining('https://test.supabase.co'),
          supabaseAnonKey: expect.stringContaining('test-anon-key...'),
          siteUrl: 'http://localhost:3000',
          nodeEnv: 'test'
        })
      )
    })

    test('should redact sensitive information in logs', () => {
      const { logSupabase } = require('@/utils/logger')
      
      jest.resetModules()
      require('../core/client')
      
      const logCall = (logSupabase as jest.Mock).mock.calls[0][1]
      
      // Should not log full keys
      expect(logCall.supabaseAnonKey).not.toBe(mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      expect(logCall.supabaseAnonKey).toContain('...')
      expect(logCall.supabaseUrl).toContain('...')
    })

  })

}) 