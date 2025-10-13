/**
 * Global Test Teardown for OrangeCat
 * Cleanup after all tests have completed
 *
 * Created: 2025-09-24
 * Last Modified: 2025-09-24
 * Last Modified Summary: Global test teardown for comprehensive testing
 */

/**
 * Global teardown function
 * This runs after all tests have completed
 */
export default async function globalTeardown() {
  console.log('🧹 Global test teardown starting...');

  try {
    // Clean up test databases
    if (process.env.TEST_DATABASE_URL) {
      console.log('Cleaning up test database...');
      // Add database cleanup logic here
    }

    // Clean up test files
    const fs = require('fs');
    const path = require('path');

    // Clean up temporary test files
    const testDirs = ['test-results', 'coverage', 'playwright-report'];
    testDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        // Keep reports for CI/CD but clean up temporary files
        console.log(`Keeping test results in: ${dir}`);
      }
    });

    // Clean up environment variables
    const testEnvVars = [
      'TEST_DATABASE_URL',
      'TEST_SUPABASE_URL',
      'TEST_SUPABASE_KEY',
      'MOCK_SERVER_PORT'
    ];

    testEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`Cleaning up environment variable: ${envVar}`);
        delete process.env[envVar];
      }
    });

    console.log('✅ Global test teardown completed successfully');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    throw error;
  }
}






