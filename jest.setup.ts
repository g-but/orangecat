/**
 * JEST SETUP - COMPREHENSIVE TEST ENVIRONMENT
 * 
 * This file configures the Jest testing environment with all necessary
 * mocks, polyfills, and global configurations for OrangeCat testing.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Comprehensive test environment setup
 */

import '@testing-library/jest-dom'; 

// -----------------------------------------------------------------------------
// Global Test Environment Configuration
// -----------------------------------------------------------------------------

// Provide sane default environment variables so modules that read them do not
// throw during import when individual test files forget to set them explicitly.
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
process.env.NEXT_PUBLIC_SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'OrangeCat'
process.env = Object.assign({ NODE_ENV: 'test' }, process.env)

// JSDOM already provides localStorage / sessionStorage but not with jest.fn()
// Create spy-able versions so tests can safely mock implementations.
function createStorageMock() {
  const storage: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => (key in storage ? storage[key] : null)),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((k) => delete storage[k])
    }),
    key: jest.fn((index: number) => Object.keys(storage)[index] ?? null),
    get length() {
      return Object.keys(storage).length
    }
  }
}

// Replace window.localStorage / sessionStorage with our spy-able mocks.
Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true
})
Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true
})

// Prevent React act warnings from polluting test output in older tests.
// (These are warning-level logs; suppress them globally.)
jest.spyOn(console, 'error').mockImplementation((...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (console as any).error.original?.(...args)
})

// Ensure every test gets a fresh module graph so imports executed in one test
// don\'t affect another (important for Supabase client tests that depend on
// createBrowserClient being called on import).
// afterEach(() => {
//   jest.resetModules()
// })

// Reset the module cache before every test so modules that run side-effects on import
// (e.g. Supabase client which calls createBrowserClient and logger) execute fresh.
beforeEach(() => {
  jest.resetModules()
})

// =====================================================================
// 🌍 ENVIRONMENT VARIABLES SETUP
// =====================================================================

// Set up test environment variables
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true })
Object.defineProperty(process.env, 'NEXT_PUBLIC_SUPABASE_URL', { value: 'https://test.supabase.co', writable: true })
Object.defineProperty(process.env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', { value: 'test-anon-key', writable: true })
Object.defineProperty(process.env, 'SUPABASE_SERVICE_ROLE_KEY', { value: 'test-service-role-key', writable: true })

// =====================================================================
// 🔧 GLOBAL MOCKS & POLYFILLS
// =====================================================================

// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock window.location
delete (window as any).location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
} as any

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// =====================================================================
// 🎯 SUPABASE MOCKS
// =====================================================================

// Mock Supabase client
jest.mock('@/services/supabase/client', () => ({
  __esModule: true,
  default: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      rangeGt: jest.fn().mockReturnThis(),
      rangeGte: jest.fn().mockReturnThis(),
      rangeLt: jest.fn().mockReturnThis(),
      rangeLte: jest.fn().mockReturnThis(),
      rangeAdjacent: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      csv: jest.fn(),
      geojson: jest.fn(),
      explain: jest.fn()
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        getPublicUrl: jest.fn()
      }))
    },
    rpc: jest.fn()
  }
}))

// =====================================================================
// 🔐 AUTH STORE MOCKS
// =====================================================================

jest.mock('@/stores/auth', () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
    clearError: jest.fn(),
    setUser: jest.fn(),
    setSession: jest.fn(),
    setProfile: jest.fn()
  }))
}))

// =====================================================================
// 🎨 UI COMPONENT MOCKS
// =====================================================================

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Search: () => 'div',
  User: () => 'div',
  Settings: () => 'div',
  LogOut: () => 'div',
  Plus: () => 'div',
  Edit: () => 'div',
  Trash: () => 'div',
  Eye: () => 'div',
  EyeOff: () => 'div',
  Check: () => 'div',
  X: () => 'div',
  ChevronDown: () => 'div',
  ChevronUp: () => 'div',
  ChevronLeft: () => 'div',
  ChevronRight: () => 'div',
  Home: () => 'div',
  Mail: () => 'div',
  Phone: () => 'div',
  MapPin: () => 'div',
  Globe: () => 'div',
  Calendar: () => 'div',
  Clock: () => 'div',
  Star: () => 'div',
  Heart: () => 'div',
  Share: () => 'div',
  Download: () => 'div',
  Upload: () => 'div',
  Image: () => 'div',
  File: () => 'div',
  Folder: () => 'div',
  Link: () => 'div',
  ExternalLink: () => 'div',
  Copy: () => 'div',
  Clipboard: () => 'div',
  Save: () => 'div',
  Refresh: () => 'div',
  RotateCcw: () => 'div',
  RotateCw: () => 'div',
  Loader: () => 'div',
  Spinner: () => 'div',
  AlertCircle: () => 'div',
  AlertTriangle: () => 'div',
  Info: () => 'div',
  HelpCircle: () => 'div',
  Shield: () => 'div',
  Lock: () => 'div',
  Unlock: () => 'div',
  Key: () => 'div',
  UserCheck: () => 'div',
  UserX: () => 'div',
  Users: () => 'div',
  UserPlus: () => 'div',
  UserMinus: () => 'div'
}))

// =====================================================================
// 🧪 TEST UTILITIES
// =====================================================================

// Global test utilities
global.testUtils = {
  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    sessionStorageMock.getItem.mockClear()
    sessionStorageMock.setItem.mockClear()
    sessionStorageMock.removeItem.mockClear()
    sessionStorageMock.clear.mockClear()
  },
  
  // Mock successful API responses
  mockSuccessResponse: (data: any) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
      text: async () => JSON.stringify(data)
    })
  },
  
  // Mock error API responses
  mockErrorResponse: (status: number, message: string) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status,
      json: async () => ({ error: message }),
      text: async () => message
    })
  },
  
  // Mock network error
  mockNetworkError: (message: string = 'Network error') => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(message))
  }
}

// =====================================================================
// 🔄 SETUP & TEARDOWN
// =====================================================================

// Before each test
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks()
  
  // Reset localStorage and sessionStorage
  if (localStorageMock.getItem?.mockClear) {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
  }
  
  if (sessionStorageMock.getItem?.mockClear) {
    sessionStorageMock.getItem.mockClear()
    sessionStorageMock.setItem.mockClear()
    sessionStorageMock.removeItem.mockClear()
    sessionStorageMock.clear.mockClear()
  }
  
  // Reset fetch mock
  if (global.fetch && (global.fetch as any).mockClear) {
    (global.fetch as jest.Mock).mockClear()
  }
  
  // Reset console mocks
  if ((console.log as any).mockClear) {
    ;(console.log as jest.Mock).mockClear()
    ;(console.warn as jest.Mock).mockClear()
    ;(console.error as jest.Mock).mockClear()
    ;(console.info as jest.Mock).mockClear()
    ;(console.debug as jest.Mock).mockClear()
  }
})

// After all tests
afterAll(() => {
  // Restore original console
  global.console = originalConsole
})

// =====================================================================
// 🎯 TYPE DECLARATIONS
// =====================================================================

declare global {
  var testUtils: {
    resetMocks: () => void
    mockSuccessResponse: (data: any) => void
    mockErrorResponse: (status: number, message: string) => void
    mockNetworkError: (message?: string) => void
  }
} 