#!/usr/bin/env node

/**
 * Comprehensive Testing Script for OrangeCat
 * Runs all test types: unit, integration, E2E, performance, security
 *
 * Usage:
 *   node scripts/comprehensive-test.js [options]
 *
 * Options:
 *   --unit              Run only unit tests
 *   --integration       Run only integration tests
 *   --e2e               Run only E2E tests
 *   --performance       Run only performance tests
 *   --security          Run only security tests
 *   --coverage          Generate coverage reports
 *   --watch             Watch mode
 *   --verbose           Verbose output
 *   --browser=<name>    Browser for E2E tests (chromium, firefox, webkit)
 *
 * Created: 2025-09-24
 * Last Modified: 2025-09-24
 * Last Modified Summary: Comprehensive testing script for all test types
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const options = {
  unit: args.includes('--unit') || (!args.some(arg => arg.startsWith('--') && !['--coverage', '--watch', '--verbose'].includes(arg))),
  integration: args.includes('--integration') || (!args.some(arg => arg.startsWith('--') && !['--coverage', '--watch', '--verbose'].includes(arg))),
  e2e: args.includes('--e2e') || (!args.some(arg => arg.startsWith('--') && !['--coverage', '--watch', '--verbose'].includes(arg))),
  performance: args.includes('--performance') || (!args.some(arg => arg.startsWith('--') && !['--coverage', '--watch', '--verbose'].includes(arg))),
  security: args.includes('--security') || (!args.some(arg => arg.startsWith('--') && !['--coverage', '--watch', '--verbose'].includes(arg))),
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  verbose: args.includes('--verbose')
};

const browser = args.find(arg => arg.startsWith('--browser='))?.split('=')[1] || 'chromium';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  console.log(message);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function runCommand(command, options = {}) {
  const { silent = false, cwd = process.cwd() } = options;

  try {
    if (!silent) {
      logInfo(`Running: ${command}`);
    }

    const result = execSync(command, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });

    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  logHeader('OrangeCat Comprehensive Test Suite');
  logInfo(`Started at: ${new Date().toISOString()}`);

  const results = {
    unit: null,
    integration: null,
    e2e: null,
    performance: null,
    security: null
  };

  try {
    // Ensure test directories exist
    const testDirs = ['test-results', 'coverage', 'playwright-report'];
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Run unit tests
    if (options.unit) {
      logHeader('Running Unit Tests');
      const jestArgs = ['--config=jest.config.advanced.js', '--passWithNoTests'];

      if (options.coverage) {
        jestArgs.push('--coverage');
      }

      if (options.watch) {
        jestArgs.push('--watch');
      }

      if (options.verbose) {
        jestArgs.push('--verbose');
      }

      const result = runCommand(`npx jest ${jestArgs.join(' ')}`);
      results.unit = result.success;

      if (!result.success) {
        logError('Unit tests failed');
        if (!options.watch) process.exit(1);
      } else {
        logSuccess('Unit tests passed');
      }
    }

    // Run integration tests
    if (options.integration) {
      logHeader('Running Integration Tests');
      const result = runCommand('npm run test:integration');
      results.integration = result.success;

      if (!result.success) {
        logError('Integration tests failed');
        if (!options.watch) process.exit(1);
      } else {
        logSuccess('Integration tests passed');
      }
    }

    // Run E2E tests
    if (options.e2e) {
      logHeader('Running End-to-End Tests');

      // Install Playwright browsers if needed
      if (!fs.existsSync('node_modules/@playwright')) {
        logInfo('Installing Playwright browsers...');
        runCommand('npx playwright install', { silent: false });
      }

      const playwrightArgs = ['test', '--config=playwright.config.advanced.ts'];

      if (options.verbose) {
        playwrightArgs.push('--reporter=line');
      } else {
        playwrightArgs.push('--reporter=list');
      }

      if (browser !== 'all') {
        playwrightArgs.push(`--project=${browser}`);
      }

      if (options.watch) {
        // For watch mode, we need to run the dev server first
        logInfo('Starting development server for E2E tests...');
        const devProcess = spawn('npm', ['run', 'dev'], {
          stdio: 'pipe',
          detached: true
        });

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
          const result = runCommand(`npx playwright ${playwrightArgs.join(' ')}`);
          results.e2e = result.success;
        } finally {
          // Clean up dev server
          if (devProcess.pid) {
            process.kill(-devProcess.pid);
          }
        }
      } else {
        const result = runCommand(`npx playwright ${playwrightArgs.join(' ')}`);
        results.e2e = result.success;
      }

      if (!results.e2e) {
        logError('E2E tests failed');
        if (!options.watch) process.exit(1);
      } else {
        logSuccess('E2E tests passed');
      }
    }

    // Run performance tests
    if (options.performance) {
      logHeader('Running Performance Tests');

      const result = runCommand('npm run test:performance');
      results.performance = result.success;

      if (!result.success) {
        logError('Performance tests failed');
        if (!options.watch) process.exit(1);
      } else {
        logSuccess('Performance tests passed');
      }
    }

    // Run security tests
    if (options.security) {
      logHeader('Running Security Tests');

      const result = runCommand('npm run test:security');
      results.security = result.success;

      if (!result.success) {
        logError('Security tests failed');
        if (!options.watch) process.exit(1);
      } else {
        logSuccess('Security tests passed');
      }
    }

    // Generate comprehensive report
    generateReport(results);

  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

function generateReport(results) {
  logHeader('Test Results Summary');

  const totalTests = Object.values(results).filter(result => result !== null).length;
  const passedTests = Object.values(results).filter(result => result === true).length;
  const failedTests = Object.values(results).filter(result => result === false).length;
  const skippedTests = Object.values(results).filter(result => result === null).length;

  log(`Total test suites: ${totalTests}`);
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, 'red');
  log(`Skipped: ${skippedTests}`, 'yellow');

  if (failedTests > 0) {
    logError(`${failedTests} test suite(s) failed`);
    process.exit(1);
  } else {
    logSuccess('All test suites passed');
  }

  // Coverage report if generated
  if (options.coverage && fs.existsSync('coverage/lcov-report/index.html')) {
    logInfo('Coverage report generated at: coverage/lcov-report/index.html');
  }

  // Test results
  if (fs.existsSync('test-results')) {
    logInfo('Detailed test results available in: test-results/');
  }

  logInfo(`Completed at: ${new Date().toISOString()}`);
}

// Handle process interruption
process.on('SIGINT', () => {
  logWarning('\nTest execution interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logWarning('\nTest execution terminated');
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
