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