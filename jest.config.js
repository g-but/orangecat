module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', 'src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
    // @noble/@scure ship ESM-only .js (used by the Solon decision verifier);
    // scoped here so no other node_modules JS goes through a transform.
    '[\\/]node_modules[\\/](@noble|@scure)[\\/].+\\.js$': [
      'ts-jest',
      {
        tsconfig: { allowJs: true },
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase/.*|@playwright/.*|isows/.*|bs58check|bs58|safe-buffer|base-x|@noble/.*|@scure/.*))',
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  // Ratchet floor — set just below measured coverage (2026-07: ~10.9% stmts,
  // 7.6% branches) so coverage can only go up. Raise as tests are added;
  // never lower to make a failing build pass.
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 7,
      functions: 7,
      lines: 10,
    },
  },
  verbose: true,
  // Exclude Playwright tests from Jest
  // Parallel-session worktrees under .claude/ carry their own __mocks__ and
  // tests; without this they pollute the haste map (duplicate manual mocks
  // silently mocking real modules) and break unrelated suites.
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/.next/',
    '<rootDir>/playwright-report/',
    '<rootDir>/test-results/',
    '<rootDir>/.claude/worktrees/',
    '\\.spec\\.(ts|tsx)$', // Exclude Playwright spec files
  ],
  // Mock Next.js modules that cause issues in Jest
  moduleNameMapper: {
    '^@/components/ui/tabs$': '<rootDir>/__mocks__/ui-tabs.js',
    // Jest resolves lucide's ESM to a build where some icons come back
    // undefined, which fails as "Element type is invalid" and looks like a
    // component bug. See __mocks__/lucide-react.js.
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^@/contexts/AuthContext$': '<rootDir>/__mocks__/contexts/AuthContext.js',
    '^@/lib/nostr/nwc$': '<rootDir>/__mocks__/nostr-nwc.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
    '^next/server$': '<rootDir>/__mocks__/next-server.js',
    '^vitest$': '<rootDir>/__mocks__/vitest.js',
    '^isows/(.*)$': '<rootDir>/__mocks__/isows.js',
    // NOTE: crypto encoders/validators (bs58check, formerly
    // bitcoin-address-validation) are deliberately NOT mocked — stubbing them
    // made tests pass vacuously: derivation against 'mockedEncodedValue'
    // instead of the BIP spec vectors, and validate() returning true for
    // EVERY string. Address validation now goes through bitcoinjs-lib (CJS),
    // so no ESM transform gymnastics are needed. Beware: the ts-jest
    // `transform` above only compiles .ts/.tsx — an ESM-only .js dependency
    // cannot be whitelisted into working via transformIgnorePatterns alone.
  },
};
