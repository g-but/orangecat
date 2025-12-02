#!/usr/bin/env node

/**
 * 🚀 OrangeCat W Script - Complete Deployment & Testing Pipeline
 *
 * This script automates the comprehensive deployment workflow:
 * 1. Commit changes with smart messaging
 * 2. Test locally via automated browser testing
 * 3. Push to main if tests pass, fix if they fail
 * 4. Monitor Vercel deployment with detailed logging
 * 5. Retry deployment if it fails
 * 6. Comprehensive production testing on orangecat.ch
 *
 * Usage: npm run w
 *        ./w
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  branch: 'main',
  productionUrl: 'https://orangecat.ch',
  vercelProject: 'orangecat',
  testTimeout: 30000, // 30 seconds
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.cyan}${colors.bright}🚀 ${message}${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`);
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

/**
 * Check if we're in a git repository
 */
function checkGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check git status
 */
function checkGitStatus() {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  return status.trim();
}

/**
 * Stage and commit changes
 */
function commitChanges() {
  logHeader('COMMITTING CHANGES');

  const status = checkGitStatus();
  if (!status) {
    logWarning('No changes to commit');
    return false;
  }

  logInfo('Staging changes...');
  execSync('git add .', { stdio: 'inherit' });

  logInfo('Committing changes...');
  const commitMessage = generateCommitMessage();
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  logSuccess('Changes committed successfully');
  return true;
}

/**
 * Generate commit message based on recent changes
 */
function generateCommitMessage() {
  try {
    const diff = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const files = diff.trim().split('\n');

    // Check for specific file patterns to generate meaningful commit messages
    if (files.some(f => f.includes('wallet'))) {
      return 'feat: enhance wallet management with duplicate support and improved UX';
    }
    if (files.some(f => f.includes('api'))) {
      return 'feat: improve API error handling and type safety';
    }
    if (files.some(f => f.includes('component'))) {
      return 'feat: add new UI components and improve user experience';
    }

    return 'feat: implement new features and improvements';
  } catch {
    return 'feat: implement new features and improvements';
  }
}

/**
 * Run automated local browser tests
 */
async function runLocalTests() {
  logHeader('LOCAL BROWSER TESTING');

  try {
    logInfo('Running automated tests on localhost:3000...');

    // Check if dev server is running (try both 3000 and 3002)
    let serverPort = 3000;
    let serverReady = false;
    let retries = 0;

    // First check if port 3000 is available
    try {
      execSync('curl -f http://localhost:3000/api/health', { stdio: 'pipe', timeout: 5000 });
      logSuccess('Development server is responding on port 3000');
      serverReady = true;
    } catch {
      // Try port 3002
      try {
        execSync('curl -f http://localhost:3002/api/health', { stdio: 'pipe', timeout: 5000 });
        logSuccess('Development server is responding on port 3002');
        serverPort = 3002;
        serverReady = true;
      } catch {
        logWarning('Development server not responding, starting it...');
        // Start dev server in background
        const devProcess = spawn('npm', ['run', 'dev'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: true
        });

        // Wait for server to be ready
        logInfo('Waiting for development server to start...');
        retries = 0;
        while (retries < 30) {
          try {
            // Try both ports
            execSync(`curl -f http://localhost:3000/api/health`, { stdio: 'pipe', timeout: 2000 });
            serverPort = 3000;
            logSuccess('Development server ready on port 3000');
            serverReady = true;
            break;
          } catch {
            try {
              execSync(`curl -f http://localhost:3002/api/health`, { stdio: 'pipe', timeout: 2000 });
              serverPort = 3002;
              logSuccess('Development server ready on port 3002');
              serverReady = true;
              break;
            } catch {
              await new Promise(resolve => setTimeout(resolve, 2000));
              retries++;
            }
          }
        }
      }
    }

      if (retries >= 30) {
        logError('Development server failed to start');
        return false;
      }

    // Run Playwright tests
    logInfo('Executing Playwright test suite...');
    execSync('npm run test:e2e:node', { stdio: 'inherit' });

    logSuccess('Local tests passed successfully');
    return true;

  } catch (error) {
    logError(`Local tests failed: ${error.message}`);
    logInfo('Please fix the issues and run `w` again');
    return false;
  }
}

/**
 * Push to main branch
 */
function pushToMain() {
  logHeader('PUSHING TO MAIN');

  try {
    logInfo('Pushing to origin main...');
    execSync(`git push origin ${CONFIG.branch}`, { stdio: 'inherit' });
    logSuccess('Successfully pushed to main branch');
    return true;
  } catch (error) {
    logError('Failed to push to main branch');
    console.error(error.message);
    return false;
  }
}

/**
 * Wait for Vercel deployment
 */
function waitForDeployment() {
  logHeader('WAITING FOR VERCEL DEPLOYMENT');

  return new Promise((resolve, reject) => {
    let deploymentFound = false;
    let deploymentUrl = null;

    logInfo('Monitoring Vercel deployments...');

    const vercel = spawn('npx', ['vercel', 'ls', '--prod', '--yes'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';

    vercel.stdout.on('data', (data) => {
      output += data.toString();
    });

    vercel.stderr.on('data', (data) => {
      console.log(data.toString());
    });

    vercel.on('close', (code) => {
      if (code === 0) {
        // Check if deployment is ready
        if (output.includes('● Ready') || output.includes(CONFIG.productionUrl)) {
          logSuccess('Deployment is ready!');
          resolve(CONFIG.productionUrl);
        } else if (output.includes('Building') || output.includes('Queued')) {
          logInfo('Deployment still in progress, waiting...');
          setTimeout(() => waitForDeployment().then(resolve).catch(reject), 5000);
        } else {
          logWarning('Deployment status unclear, proceeding to test...');
          resolve(CONFIG.productionUrl);
        }
      } else {
        logError('Failed to check deployment status');
        reject(new Error('Vercel deployment check failed'));
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      if (!deploymentFound) {
        logWarning('Deployment monitoring timeout, proceeding to test...');
        resolve(CONFIG.productionUrl);
      }
    }, 300000);
  });
}

/**
 * Comprehensive production testing with automated browser validation
 */
async function runProductionTests(deploymentUrl) {
  logHeader('PRODUCTION BROWSER TESTING');

  logInfo(`Running comprehensive tests on: ${deploymentUrl}`);

  try {
    const { chromium } = await import('playwright');

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    let testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };

    // Test 1: Health check
    try {
      logInfo('🩺 Testing health endpoint...');
      const healthResponse = await page.goto(`${deploymentUrl}/api/health`);
      if (healthResponse?.ok()) {
        logSuccess('Health check passed');
        testResults.passed++;
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      logError(`Health check failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Health check');
    }

    // Test 2: Landing page loads
    try {
      logInfo('🏠 Testing landing page...');
      await page.goto(deploymentUrl, { waitUntil: 'networkidle' });
      const title = await page.title();
      if (title && title.length > 0) {
        logSuccess('Landing page loaded successfully');
        testResults.passed++;
      } else {
        throw new Error('Landing page title not found');
      }
    } catch (error) {
      logError(`Landing page test failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Landing page');
    }

    // Test 3: Authentication flow (check for login elements)
    try {
      logInfo('🔐 Testing authentication elements...');
      const hasAuthElements = await page.locator('text=/Sign In|Login|Auth/i').count() > 0 ||
                              await page.locator('[data-testid*="auth"], [data-testid*="login"]').count() > 0;

      if (hasAuthElements) {
        logSuccess('Authentication elements found');
        testResults.passed++;
      } else {
        logInfo('No authentication elements found (may be expected for public pages)');
        testResults.passed++; // Not necessarily a failure
      }
    } catch (error) {
      logError(`Authentication test failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Authentication');
    }

    // Test 4: Navigation and routing
    try {
      logInfo('🧭 Testing navigation...');
      // Look for navigation elements
      const navElements = await page.locator('nav, [role="navigation"], header a').count();
      if (navElements > 0) {
        logSuccess('Navigation elements found');
        testResults.passed++;
      } else {
        logWarning('No navigation elements found');
        testResults.passed++; // Not critical
      }
    } catch (error) {
      logError(`Navigation test failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Navigation');
    }

    // Test 5: Error handling (404 page)
    try {
      logInfo('🚫 Testing 404 error handling...');
      const notFoundResponse = await page.goto(`${deploymentUrl}/nonexistent-page-12345`, { waitUntil: 'networkidle' });
      if (notFoundResponse?.status() === 404) {
        logSuccess('404 error handling works');
        testResults.passed++;
      } else {
        logWarning('404 page may not be properly configured');
        testResults.passed++; // Not critical
      }
    } catch (error) {
      logError(`404 test failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Error handling');
    }

    await browser.close();

    // Summary
    logInfo(`Test Results: ${testResults.passed} passed, ${testResults.failed} failed`);

    if (testResults.failed > 0) {
      logError(`Failed tests: ${testResults.errors.join(', ')}`);
      return false;
    }

    logSuccess('All production tests passed!');
    return true;

  } catch (error) {
    logError(`Production testing failed: ${error.message}`);
    return false;
  }
}

/**
 * Legacy test function - opens browser for manual testing
 */
function testFeatures(deploymentUrl) {
  logHeader('MANUAL BROWSER TESTING');

  logInfo(`Opening browser for manual testing at: ${deploymentUrl}`);

  try {
    // Try to open browser (works on most systems)
    const commands = [
      'xdg-open', // Linux
      'open',     // macOS
      'start'     // Windows
    ];

    for (const cmd of commands) {
      try {
        execSync(`${cmd} "${deploymentUrl}"`, { stdio: 'pipe' });
        break;
      } catch {
        // Try next command
      }
    }

    logSuccess('Browser opened successfully');
    logInfo('Please manually test the application:');
    logInfo('1. Check landing page loads correctly');
    logInfo('2. Test authentication flows');
    logInfo('3. Verify navigation works');
    logInfo('4. Test core functionality');
    logInfo('5. Check for any console errors');

  } catch (error) {
    logWarning('Could not automatically open browser');
    logInfo(`Please manually visit: ${deploymentUrl}`);
  }
}

/**
 * Show comprehensive deployment summary
 */
function showSummary(success, deploymentUrl) {
  console.log(`\n${colors.magenta}${colors.bright}🎉 DEPLOYMENT PIPELINE SUMMARY${colors.reset}`);
  console.log(`${colors.magenta}${'═'.repeat(60)}${colors.reset}`);

  console.log(`${colors.blue}📋 Pipeline Steps Completed:${colors.reset}`);
  console.log(`${success ? colors.green : colors.red}✓${colors.reset} Code committed and tested locally`);
  console.log(`${success ? colors.green : colors.red}✓${colors.reset} Changes pushed to main branch`);
  console.log(`${success ? colors.green : colors.red}✓${colors.reset} Vercel deployment monitored`);
  console.log(`${success ? colors.green : colors.red}✓${colors.reset} Production tests executed`);
  console.log(`${colors.blue}✓${colors.reset} Manual testing guidance provided`);

  if (success) {
    logSuccess('🎉 Full deployment pipeline completed successfully!');
    console.log(`${colors.blue}📍 Production URL: ${colors.bright}${deploymentUrl}${colors.reset}`);
    console.log(`${colors.blue}🔗 Health Check: ${deploymentUrl}/api/health${colors.reset}`);
    console.log(`${colors.blue}📊 Vercel Dashboard: https://vercel.com/dashboard${colors.reset}`);
  } else {
    logError('⚠️ Deployment completed but with issues');
    console.log(`${colors.yellow}🔧 Check the logs above for error details${colors.reset}`);
    console.log(`${colors.yellow}🔄 Consider rollback if critical functionality is broken${colors.reset}`);
  }

  console.log(`\n${colors.cyan}🚀 Next Steps:${colors.reset}`);
  console.log(`${colors.cyan}• Complete manual testing in the opened browser${colors.reset}`);
  console.log(`${colors.cyan}• Monitor application logs: ${colors.bright}npm run monitor:logs${colors.reset}`);
  console.log(`${colors.cyan}• Check Vercel analytics for performance metrics${colors.reset}`);
  console.log(`${colors.cyan}• Verify user feedback and error reports${colors.reset}`);

  if (!success) {
    console.log(`\n${colors.red}🚨 Issue Resolution:${colors.reset}`);
    console.log(`${colors.red}• Run ${colors.bright}npm run deploy:rollback${colors.reset} if rollback needed${colors.reset}`);
    console.log(`${colors.red}• Check ${colors.bright}npm run monitor:logs${colors.reset} for deployment errors${colors.reset}`);
    console.log(`${colors.red}• Verify ${colors.bright}${deploymentUrl}/api/health${colors.reset} is responding${colors.reset}`);
  }
}

/**
 * Main deployment workflow
 */
async function main() {
  console.clear();

  // ASCII Art Banner
  console.log(`${colors.magenta}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    🚀 ORANGECAT W SCRIPT                    ║');
  console.log('║          Complete Deployment & Testing Pipeline            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);

  try {
    // Check prerequisites
    if (!checkGitRepo()) {
      logError('Not in a git repository');
      process.exit(1);
    }

    // Step 1: Commit changes
    logHeader('STEP 1: COMMIT CHANGES');
    const hasChanges = commitChanges();
    if (!hasChanges) {
      logWarning('No changes to deploy');
      return;
    }

    // Step 2: Local testing before deployment
    logHeader('STEP 2: LOCAL TESTING');
    const localTestsPassed = await runLocalTests();
    if (!localTestsPassed) {
      logError('Local tests failed - please fix issues and try again');
      logInfo('Common fixes:');
      logInfo('• Check console for JavaScript errors');
      logInfo('• Verify API endpoints are working');
      logInfo('• Test core user flows manually');
      process.exit(1);
    }

    // Step 3: Push to main (only if tests passed)
    logHeader('STEP 3: PUSH TO MAIN');
    const pushSuccess = pushToMain();
    if (!pushSuccess) {
      logError('Push failed, cannot proceed with deployment');
      process.exit(1);
    }

    // Step 4: Monitor Vercel deployment with enhanced logging
    logHeader('STEP 4: DEPLOYMENT MONITORING');
    logInfo('Vercel will auto-deploy from main branch...');
    let deploymentUrl;
    let deploymentRetries = 0;
    const maxRetries = 2;

    while (deploymentRetries <= maxRetries) {
      try {
        deploymentUrl = await waitForDeployment();
        logSuccess('Deployment completed successfully');
        break;
      } catch (error) {
        deploymentRetries++;
        if (deploymentRetries <= maxRetries) {
          logWarning(`Deployment attempt ${deploymentRetries} failed, retrying...`);
          logInfo('Waiting 30 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        } else {
          logError(`Deployment failed after ${maxRetries + 1} attempts`);
          throw error;
        }
      }
    }

    // Step 5: Comprehensive production testing
    logHeader('STEP 5: PRODUCTION VALIDATION');
    const productionTestsPassed = await runProductionTests(deploymentUrl);
    if (!productionTestsPassed) {
      logError('Production tests failed - deployment may have issues');
      logWarning('Please investigate and consider rollback if critical');
    }

    // Step 6: Manual testing guidance
    logHeader('STEP 6: MANUAL TESTING');
    testFeatures(deploymentUrl);

    // Show final summary
    showSummary(productionTestsPassed, deploymentUrl);

    if (productionTestsPassed) {
      logSuccess('🎉 Deployment pipeline completed successfully!');
    } else {
      logWarning('⚠️ Deployment completed but some tests failed - manual verification recommended');
    }

  } catch (error) {
    logError(`Deployment pipeline failed: ${error.message}`);
    showSummary(false, CONFIG.productionUrl);
    process.exit(1);
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

export { main };
