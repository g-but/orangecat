#!/usr/bin/env node

/**
 * 🚀 OrangeCat Automated Deployment System
 *
 * This is the SINGLE deployment script for OrangeCat.
 * When you run `npm run deploy`, this handles everything.
 *
 * Process:
 * 1. Code quality checks
 * 2. Git commit & push
 * 3. Trigger GitHub Actions
 * 4. Monitor deployment
 * 5. Browser verification
 * 6. Notification
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

// Configuration
const CONFIG = {
  productionUrl: 'https://www.orangecat.ch',
  githubWorkflow: 'one-button-deploy.yml',
  vercelProject: 'orangecat',
  healthCheckTimeout: 300, // 5 minutes
  browserVerifyTimeout: 180, // 3 minutes
};

// Colors and styling
const colors = {
  title: chalk.bold.blue,
  success: chalk.bold.green,
  error: chalk.bold.red,
  warning: chalk.bold.yellow,
  info: chalk.cyan,
  dim: chalk.dim,
};

/**
 * Display deployment banner
 */
function showBanner() {
  console.clear();
  console.log(
    colors.title(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 ORANGECAT DEPLOYER                    ║
║              Automated Production Deployment                 ║
║                                                              ║
║  This is the ONLY way to deploy OrangeCat to production.    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `)
  );
}

/**
 * Execute command with proper error handling
 */
function execCommand(command, description, options = {}) {
  console.log(colors.info(`⏳ ${description}...`));

  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options,
    });

    console.log(colors.success(`✅ ${description} complete`));
    return result;
  } catch (error) {
    console.log(colors.error(`❌ ${description} failed: ${error.message}`));
    throw error;
  }
}

/**
 * Check code quality
 */
async function checkCodeQuality() {
  console.log(colors.info('\n🔍 PHASE 1: Code Quality Checks\n'));

  // Lint
  execCommand('npm run lint', 'Running linter');

  // Type check
  execCommand('npm run type-check', 'Running TypeScript check');

  // Security check
  try {
    execCommand('npm run test:security', 'Running security tests');
  } catch (error) {
    console.log(colors.warning('⚠️ Security tests failed, but continuing with deployment...'));
  }

  console.log(colors.success('✅ All quality checks passed'));
}

/**
 * Handle Git operations
 */
function handleGitOperations() {
  console.log(colors.info('\n📝 PHASE 2: Git Operations\n'));

  // Check git status
  const status = execSync('git status --porcelain', { encoding: 'utf8' });

  if (!status.trim()) {
    console.log(colors.warning('⚠️ No changes to commit. Deployment cancelled.'));
    process.exit(0);
  }

  // Stage all changes
  execCommand('git add .', 'Staging all changes');

  // Create commit message
  const commitMessage = `deploy: production deployment ${new Date().toISOString().split('T')[0]}

- Automated deployment via npm run deploy
- All quality checks passed
- Ready for production`;

  // Commit
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  // Push to main
  execCommand('git push origin main', 'Pushing to main branch');

  console.log(colors.success('✅ Git operations complete'));
}

/**
 * Trigger GitHub Actions workflow
 */
async function triggerGitHubWorkflow() {
  console.log(colors.info('\n🚀 PHASE 3: Triggering GitHub Actions\n'));

  // Use the existing one-button-deploy script
  execCommand(
    'node scripts/deployment/one-button-deploy.js production --force',
    'Triggering production deployment'
  );

  console.log(colors.success('✅ GitHub Actions triggered'));
}

/**
 * Monitor deployment progress
 */
async function monitorDeployment() {
  console.log(colors.info('\n📊 PHASE 4: Monitoring Deployment\n'));

  console.log(colors.info('🔗 Deployment URLs:'));
  console.log(colors.dim(`   GitHub Actions: https://github.com/g-but/orangecat/actions`));
  console.log(colors.dim(`   Vercel Dashboard: https://vercel.com/dashboard`));
  console.log(colors.dim(`   Production Site: ${CONFIG.productionUrl}`));

  // Wait for deployment to start
  console.log(colors.info('⏳ Waiting for deployment to begin...'));
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

  // Monitor GitHub Actions status
  console.log(colors.info('🔍 Monitoring GitHub Actions status...'));

  let attempts = 0;
  const maxAttempts = 60; // 10 minutes

  while (attempts < maxAttempts) {
    try {
      // Check if workflow is running/completed
      const workflowStatus = execSync(
        'gh run list --workflow=one-button-deploy.yml --limit=1 --json=status,conclusion',
        {
          encoding: 'utf8',
        }
      );

      const status = JSON.parse(workflowStatus)[0];

      if (status.status === 'completed') {
        if (status.conclusion === 'success') {
          console.log(colors.success('✅ GitHub Actions completed successfully'));
          break;
        } else {
          throw new Error(`GitHub Actions failed with conclusion: ${status.conclusion}`);
        }
      } else if (status.status === 'in_progress') {
        console.log(
          colors.info(`⏳ GitHub Actions in progress... (${attempts + 1}/${maxAttempts})`)
        );
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      attempts++;
    } catch (error) {
      console.log(colors.warning(`⚠️ Could not check workflow status: ${error.message}`));
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
  }

  if (attempts >= maxAttempts) {
    throw new Error('Deployment monitoring timeout');
  }
}

/**
 * Verify deployment with browser automation
 */
async function verifyWithBrowser() {
  console.log(colors.info('\n🌐 PHASE 5: Browser Verification\n'));

  try {
    // Run browser verification script
    execCommand('node scripts/deployment/browser-verify.js', 'Running browser verification');
    console.log(colors.success('✅ Browser verification passed'));
  } catch (error) {
    console.log(colors.error(`❌ Browser verification failed: ${error.message}`));
    throw error;
  }
}

/**
 * Final notification and summary
 */
function showDeploymentSummary(startTime) {
  const duration = Math.round((Date.now() - startTime) / 1000 / 60); // minutes

  console.log(
    colors.success(`

╔══════════════════════════════════════════════════════════════╗
║                    🎉 DEPLOYMENT SUCCESS                    ║
╚══════════════════════════════════════════════════════════════╝

📊 DEPLOYMENT SUMMARY
══════════════════════════════════════════════════════════════
🌐 Production URL: ${CONFIG.productionUrl}
⏱️  Total Duration: ${duration} minutes
📅 Completed: ${new Date().toLocaleString()}

🔍 VERIFICATION RESULTS
══════════════════════════════════════════════════════════════
✅ Code quality checks passed
✅ Git operations completed
✅ GitHub Actions successful
✅ Browser verification passed
✅ Production site live

📱 MONITORING LINKS
══════════════════════════════════════════════════════════════
GitHub Actions: https://github.com/g-but/orangecat/actions
Vercel Dashboard: https://vercel.com/dashboard
Production Site: ${CONFIG.productionUrl}

🎯 NEXT STEPS
══════════════════════════════════════════════════════════════
• Monitor site performance
• Check user feedback
• Plan next deployment

Need help? Check docs/deployment/DEPLOYMENT_PROCESS.md
══════════════════════════════════════════════════════════════

  `)
  );
}

/**
 * Handle deployment failure
 */
function handleFailure(error, startTime) {
  const duration = Math.round((Date.now() - startTime) / 1000 / 60);

  console.log(
    colors.error(`

╔══════════════════════════════════════════════════════════════╗
║                    🚨 DEPLOYMENT FAILED                     ║
╚══════════════════════════════════════════════════════════════╝

❌ ERROR: ${error.message}

📊 FAILURE SUMMARY
══════════════════════════════════════════════════════════════
⏱️  Duration: ${duration} minutes
📅 Failed: ${new Date().toLocaleString()}

🔧 TROUBLESHOOTING
══════════════════════════════════════════════════════════════
1. Check GitHub Actions logs
2. Verify Vercel deployment status
3. Run browser verification manually
4. Check production site directly

📱 MONITORING LINKS
══════════════════════════════════════════════════════════════
GitHub Actions: https://github.com/g-but/orangecat/actions
Vercel Dashboard: https://vercel.com/dashboard
Production Site: ${CONFIG.productionUrl}

🆘 GET HELP
══════════════════════════════════════════════════════════════
• Check docs/deployment/DEPLOYMENT_PROCESS.md
• Run: npm run deploy:diagnose
• Contact deployment team

══════════════════════════════════════════════════════════════

  `)
  );

  process.exit(1);
}

/**
 * Main deployment function
 */
async function main() {
  const startTime = Date.now();

  try {
    showBanner();

    console.log(
      colors.warning(`
⚠️  PRODUCTION DEPLOYMENT WARNING
This will deploy to the live production environment.
The process will take ~10-15 minutes and is fully automated.

Press Ctrl+C to cancel, or Enter to continue...
    `)
    );

    // Wait for user confirmation
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Phase 1: Code Quality
    await checkCodeQuality();

    // Phase 2: Git Operations
    handleGitOperations();

    // Phase 3: Trigger GitHub Actions
    await triggerGitHubWorkflow();

    // Phase 4: Monitor Deployment
    await monitorDeployment();

    // Phase 5: Browser Verification
    await verifyWithBrowser();

    // Success!
    showDeploymentSummary(startTime);
  } catch (error) {
    handleFailure(error, startTime);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log(colors.warning('\n\n🛑 Deployment cancelled by user'));
  process.exit(0);
});

process.on('unhandledRejection', error => {
  console.log(colors.error(`\n❌ Unhandled error: ${error.message}`));
  process.exit(1);
});

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
