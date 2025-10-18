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
      updateUser: jest.fn(),
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

// =====================================================================
// 🗄️ SUPABASE-JS GLOBAL MOCK (createClient)
// =====================================================================

jest.mock('@supabase/supabase-js', () => {
  // Simple in-memory store per table for rudimentary insert/select/update/delete
  const inMemoryDB: Record<string, any[]> = {}

  function tableStore(name: string) {
    if (!inMemoryDB[name]) inMemoryDB[name] = []
    return inMemoryDB[name]
  }

  const buildQuery = (table: string, dataset: any[]): any => {
    const builder = {
      _table: table,
      _store: tableStore(table),
      _results: dataset,
      select(this: any, _columns = '*', opts?: any) {
        if (opts && opts.count) {
          return Promise.resolve({ data: this._results, count: this._results.length, error: null })
        }
        return buildQuery(this._table, this._results)
      },
      eq(this: any, column: string, value: any) {
        const filtered = this._results.filter((row: any) => row[column] === value)
        return buildQuery(this._table, filtered)
      },
      order(this: any, column: string, { ascending = true } = {}) {
        const sorted = [...this._results].sort((a, b) => {
          if (a[column] === b[column]) return 0
          return ascending ? (a[column] > b[column] ? 1 : -1) : (a[column] < b[column] ? 1 : -1)
        })
        return buildQuery(this._table, sorted)
      },
      range(this: any, from: number, to: number) {
        const ranged = this._results.slice(from, to + 1)
        return buildQuery(this._table, ranged)
      },
      limit(this: any, count: number) {
        const limited = this._results.slice(0, count)
        return Promise.resolve({ data: limited, error: null })
      },
      single(this: any) {
        if (this._results.length === 0) return Promise.resolve({ data: null, error: null })
        return Promise.resolve({ data: this._results[0], error: null })
      },
      maybeSingle(this: any) {
        if (this._results.length === 0) return Promise.resolve({ data: null, error: null })
        return Promise.resolve({ data: this._results[0], error: null })
      },
      update(this: any, values: any) {
        this._results.forEach((row: any) => Object.assign(row, values))
        return buildQuery(this._table, this._results)
      },
      upsert(this: any, obj: any) {
        const targetArr = this._store
        const items = Array.isArray(obj) ? obj : [obj]
        items.forEach(item => {
          const existingIdx = targetArr.findIndex((r: any) => r.id === item.id)
          if (existingIdx !== -1) targetArr[existingIdx] = { ...targetArr[existingIdx], ...item }
          else targetArr.push(item)
        })
        return buildQuery(this._table, items)
      },
      delete(this: any) {
        this._results.forEach((row: any) => {
          const idx = this._store.indexOf(row)
          if (idx !== -1) this._store.splice(idx, 1)
        })
        return Promise.resolve({ data: null, error: null })
      },
      count(this: any) {
        return Promise.resolve({ count: this._results.length, error: null })
      }
    }
    return builder
  }

  function from(tableName: string) {
    const storeRef = tableStore(tableName)
    const baseBuilder = buildQuery(tableName, storeRef)
    return {
      ...baseBuilder,
      insert(rows: any) {
        const arr = tableStore(tableName)
        const inserted = Array.isArray(rows) ? rows : [rows]
        arr.push(...inserted)
        return buildQuery(tableName, inserted)
      }
    }
  }

  // Seed base data for tests
  const seedProfiles = () => {
    const profiles = tableStore('profiles')
    if (profiles.length === 0) {
      profiles.push(
        { id: 'test-user', username: 'orangecat', display_name: 'Orange Cat', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'search-1', username: 'searchtest1', display_name: 'Search User 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'search-2', username: 'searchtest2', display_name: 'Search User 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'user-123', username: 'existinguser', display_name: 'Existing User', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      )
    }
  }
  seedProfiles()

  const mockClient = {
    from,
    auth: {
      signInWithPassword: jest.fn(({ email }) => Promise.resolve({ data: { user: { id: 'test-user', email } }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: { access_token: 'token' } }, error: null }))
    },
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }

  return {
    __esModule: true,
    createClient: jest.fn(() => mockClient)
  }
})

// Ensure Storage.prototype functions are jest.fn for spying in tests
Object.defineProperty(Storage.prototype, 'setItem', { value: jest.fn(), writable: true })
Object.defineProperty(Storage.prototype, 'getItem', { value: jest.fn(), writable: true }) 

// =====================================================================
// 🧪 PROFILE MAPPER MOCKS
// =====================================================================

// Additional mapper mock for Profile tests
jest.mock('@/services/profile/mapper', () => ({
  ProfileMapper: {
    mapDatabaseToProfile: (data: any) => data,
    mapProfileToDatabase: (data: any) => data
  }
}))

// =====================================================================
// 🧪 PROFILE READER MOCKS
// =====================================================================

jest.mock('@/services/profile/reader', () => {
  const supabase = require('@/services/supabase/client').default
  return {
    ProfileReader: {
      getProfile: jest.fn((userId: string) =>
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
          .then((res: any) => res?.data ?? null)
          .catch(() => null)
      ),
      getProfiles: jest.fn(() => Promise.resolve([])),
      searchProfiles: jest.fn(() => Promise.resolve([])),
      getAllProfiles: jest.fn(() => Promise.resolve([])),
      incrementProfileViews: jest.fn()
    }
  }
})

// -----------------------------------------------------------------------------
// SocialService global mock to satisfy socialService.test expectations
// -----------------------------------------------------------------------------

jest.mock('@/services/socialService', () => {
  const makeSuccess = (length = 2) => Array.from({ length }, (_, i) => ({ id: (i+1).toString(), username: `user${i+1}` }))
  return {
    PeopleService: {
      searchPeople: jest.fn(() => Promise.resolve(makeSuccess(2)))
    },
    OrganizationService: {
      getUserOrganizations: jest.fn(() => Promise.resolve([]))
    },
    ProjectService: {
      getUserProjects: jest.fn(() => Promise.resolve([]))
    },
    EmptyStateService: {
      getEmptyStateContent: jest.fn((section: string) => ({
        title: `No ${section} Yet`,
        description: `You haven't connected with any ${section} yet.`,
        benefits: [
          'Collaborate on Bitcoin projects',
          'Shared Bitcoin treasury management',
          'Dedicated Bitcoin fundraising'
        ],
        examples: ['Bitcoin development collectives'],
        primaryAction: { label: 'Search', action: '/' },
        secondaryAction: { label: 'Profile', action: '/profile' }
      }))
    }
  }
}) 

// =====================================================================
// 🧪 TABS MOCKS
// =====================================================================

jest.mock('@/components/ui/tabs', () => () => 'div') 