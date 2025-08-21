module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', 'src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase/.*|@playwright/.*|isows/.*))'
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  // Exclude Playwright tests from Jest
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/.next/',
    '<rootDir>/playwright-report/',
    '<rootDir>/test-results/'
  ],
  // Add global test environment variables
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  // Mock Next.js modules that cause issues in Jest
  moduleNameMapper: {
    '^@/components/ui/tabs$': '<rootDir>/__mocks__/ui-tabs.js',
    '^@/contexts/AuthContext$': '<rootDir>/__mocks__/contexts/AuthContext.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
    '^next/server$': '<rootDir>/__mocks__/next-server.js',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^react-router-dom$': '<rootDir>/__mocks__/react-router-dom.js',
    '^vitest$': '<rootDir>/__mocks__/vitest.js',
    '^isows/(.*)$': '<rootDir>/__mocks__/isows.js'
  }
}; 