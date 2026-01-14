/**
 * Advanced Playwright Configuration for OrangeCat
 * Comprehensive E2E testing setup with multiple browsers, devices, and environments
 *
 * Created: 2025-09-24
 * Last Modified: 2025-09-24
 * Last Modified Summary: Advanced Playwright configuration for comprehensive E2E testing
 */

import { defineConfig, devices } from '@playwright/test';

// Base configuration shared across different test configs
const baseConfig = {
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry' as const,
    screenshot: 'only-on-failure' as const,
    video: process.env.CI ? 'retain-on-failure' as const : 'off' as const,
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
};

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }]
  ] : [
    ['html'],
    ['line']
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: process.env.CI ? 'retain-on-failure' : 'off',

    /* Global timeout for each test */
    actionTimeout: 10000,
    navigationTimeout: 30000,

  },

  /* Global test timeout */
  timeout: 60000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5']
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12']
      },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro']
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global test configuration */
  expect: {
    timeout: 10000,
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },

});

/* Additional configuration for different environments */
if (process.env.ENVIRONMENT === 'production') {
  // Production-specific configuration
}

if (process.env.ENVIRONMENT === 'staging') {
  // Staging-specific configuration
}

// Brave browser configuration (use BROWSER=brave environment variable)
// Note: When using Brave, set this config manually or extend the base config
export const braveConfig = defineConfig({
  ...baseConfig,
  projects: [
    {
      name: 'Brave',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          executablePath: '/usr/bin/brave-browser',
        },
      },
    },
  ],
});

/* Performance testing configuration */
export const performanceConfig = defineConfig({
  testDir: './tests/performance',
  use: {
    ...baseConfig.use,
    trace: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Performance',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],
});

/* Security testing configuration */
export const securityConfig = defineConfig({
  testDir: './tests/security',
  use: {
    ...baseConfig.use,
    actionTimeout: 15000,
    navigationTimeout: 45000,
  },
  projects: [
    {
      name: 'Security',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],
});

/* Accessibility testing configuration */
export const accessibilityConfig = defineConfig({
  testDir: './tests/accessibility',
  use: {
    ...baseConfig.use,
    // Configure for screen reader testing
  },
  projects: [
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],
});

/* Visual regression testing configuration */
export const visualConfig = defineConfig({
  testDir: './tests/visual',
  use: {
    ...baseConfig.use,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],
});

/* API testing configuration */
export const apiConfig = defineConfig({
  testDir: './tests/api',
  use: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  },
  projects: [
    {
      name: 'API',
      use: {
        // API tests don't need browser
      },
    },
  ],
});

/* Mobile testing configuration */
export const mobileConfig = defineConfig({
  testDir: './tests/mobile',
  use: {
    ...baseConfig.use,
    viewport: { width: 375, height: 667 }
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});






