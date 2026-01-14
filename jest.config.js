module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', 'src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase/.*|@playwright/.*|isows/.*|bitcoin-address-validation|base58-js|bs58check|bs58|safe-buffer|base-x))'
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
    '<rootDir>/test-results/',
    '\\.spec\\.(ts|tsx)$'  // Exclude Playwright spec files
  ],
  // Mock Next.js modules that cause issues in Jest
  moduleNameMapper: {
    '^@/components/ui/tabs$': '<rootDir>/__mocks__/ui-tabs.js',
    '^@/contexts/AuthContext$': '<rootDir>/__mocks__/contexts/AuthContext.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
    '^next/server$': '<rootDir>/__mocks__/next-server.js',
    '^react-router-dom$': '<rootDir>/__mocks__/react-router-dom.js',
    '^vitest$': '<rootDir>/__mocks__/vitest.js',
    '^isows/(.*)$': '<rootDir>/__mocks__/isows.js',
    '^bitcoin-address-validation$': '<rootDir>/__mocks__/bitcoin-address-validation.js',
    '^bs58check$': '<rootDir>/__mocks__/bs58check.js'
  }
}; 