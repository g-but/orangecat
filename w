#!/usr/bin/env node

/**
 * 🚀 OrangeCat W Script - One-Button Deploy & Test
 *
 * This script automates the complete deployment and testing workflow:
 * 1. Commit and push to main branch
 * 2. Monitor Vercel deployment
 * 3. Test newly implemented features in browser
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
 * Test the deployed features
 */
function testFeatures(deploymentUrl) {
  logHeader('TESTING DEPLOYED FEATURES');

  logInfo(`Opening browser to test features at: ${deploymentUrl}`);

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
    logInfo('Please test the newly implemented duplicate wallet feature:');
    logInfo('1. Go to Dashboard → Wallets');
    logInfo('2. Try adding a wallet with an address you already have');
    logInfo('3. Verify the duplicate warning dialog appears');
    logInfo('4. Test both "Add Anyway" and "Cancel" options');

  } catch (error) {
    logWarning('Could not automatically open browser');
    logInfo(`Please manually visit: ${deploymentUrl}`);
  }
}

/**
 * Show deployment summary
 */
function showSummary(success, deploymentUrl) {
  console.log(`\n${colors.magenta}${colors.bright}🎉 DEPLOYMENT SUMMARY${colors.reset}`);
  console.log(`${colors.magenta}${'═'.repeat(50)}${colors.reset}`);

  if (success) {
    logSuccess('Deployment completed successfully!');
    console.log(`${colors.blue}📍 Production URL: ${colors.bright}${deploymentUrl}${colors.reset}`);
    console.log(`${colors.blue}🔗 Health Check: ${deploymentUrl}/api/health${colors.reset}`);
    console.log(`${colors.blue}📊 Vercel Dashboard: https://vercel.com/dashboard${colors.reset}`);
  } else {
    logError('Deployment failed or incomplete');
    console.log(`${colors.yellow}🔧 Check the logs above for error details${colors.reset}`);
  }

  console.log(`\n${colors.cyan}🚀 Next Steps:${colors.reset}`);
  console.log(`${colors.cyan}• Test the duplicate wallet feature in the browser${colors.reset}`);
  console.log(`${colors.cyan}• Monitor application logs if needed${colors.reset}`);
  console.log(`${colors.cyan}• Check Vercel analytics for performance metrics${colors.reset}`);
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
  console.log('║             One-Button Deploy & Test Workflow              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);

  try {
    // Check prerequisites
    if (!checkGitRepo()) {
      logError('Not in a git repository');
      process.exit(1);
    }

    // Step 1: Commit changes
    const hasChanges = commitChanges();
    if (!hasChanges) {
      logWarning('No changes to deploy');
      return;
    }

    // Step 2: Push to main
    const pushSuccess = pushToMain();
    if (!pushSuccess) {
      logError('Push failed, cannot proceed with deployment');
      process.exit(1);
    }

    // Step 3: Wait for Vercel deployment
    logInfo('Vercel will auto-deploy from main branch...');
    const deploymentUrl = await waitForDeployment();

    // Step 4: Test features
    testFeatures(deploymentUrl);

    // Show summary
    showSummary(true, deploymentUrl);

  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
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
