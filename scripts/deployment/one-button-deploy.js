#!/usr/bin/env node

/**
 * 🚀 OrangeCat One-Button Deployment Script
 * 
 * This script provides a simple CLI interface for triggering deployments
 * via GitHub Actions workflow_dispatch API.
 * 
 * Usage:
 *   node scripts/one-button-deploy.js [environment] [options]
 *   npm run deploy:button [environment] [options]
 * 
 * Examples:
 *   node scripts/one-button-deploy.js production
 *   node scripts/one-button-deploy.js staging --skip-tests
 *   npm run deploy:button production
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import chalk from 'chalk';

// Configuration
const CONFIG = {
  workflow: 'one-button-deploy.yml',
  defaultBranch: 'main',
  environments: ['staging', 'production']
};

// Colors and styling
const colors = {
  title: chalk.bold.blue,
  success: chalk.bold.green,
  error: chalk.bold.red,
  warning: chalk.bold.yellow,
  info: chalk.cyan,
  dim: chalk.dim
};

/**
 * Display the deployment banner
 */
function showBanner() {
  console.clear();
  console.log(colors.title(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 ORANGECAT DEPLOYER                    ║
║                 One-Button Production Deployment             ║
╚══════════════════════════════════════════════════════════════╝
  `));
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  const options = {
    environment: args[0] || 'production',
    skipTests: args.includes('--skip-tests') || args.includes('-s'),
    forceDeploy: args.includes('--force') || args.includes('-f'),
    help: args.includes('--help') || args.includes('-h')
  };

  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(colors.info(`
🚀 OrangeCat One-Button Deployment

USAGE:
  node scripts/one-button-deploy.js [environment] [options]

ENVIRONMENTS:
  staging       Deploy to staging environment
  production    Deploy to production environment (default)

OPTIONS:
  --skip-tests, -s    Skip test execution (emergency only)
  --force, -f         Force deployment (override quality gates)
  --help, -h          Show this help message

EXAMPLES:
  node scripts/one-button-deploy.js production
  node scripts/one-button-deploy.js staging --skip-tests
  npm run deploy:button production

GITHUB ACTIONS:
  You can also trigger deployments directly from:
  https://github.com/your-org/orangecat/actions/workflows/one-button-deploy.yml
  `));
}

/**
 * Validate deployment environment
 */
function validateEnvironment(environment) {
  if (!CONFIG.environments.includes(environment)) {
    console.log(colors.error(`
❌ Invalid environment: ${environment}
Valid environments: ${CONFIG.environments.join(', ')}
    `));
    process.exit(1);
  }
}

/**
 * Check if GitHub CLI is installed
 */
async function checkGitHubCLI() {
  return new Promise((resolve) => {
    const gh = spawn('gh', ['--version'], { stdio: 'pipe' });
    
    gh.on('close', (code) => {
      resolve(code === 0);
    });
    
    gh.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Trigger GitHub Actions workflow
 */
async function triggerWorkflow(options) {
  const { environment, skipTests, forceDeploy } = options;
  
  console.log(colors.info(`
🎯 Deployment Configuration:
   Environment: ${environment}
   Skip Tests: ${skipTests ? 'Yes (Emergency)' : 'No'}
   Force Deploy: ${forceDeploy ? 'Yes (Override Quality Gates)' : 'No'}
   Branch: ${CONFIG.defaultBranch}
  `));

  console.log(colors.warning('⏳ Triggering GitHub Actions workflow...'));

  const workflowArgs = [
    'workflow', 'run', CONFIG.workflow,
    '--field', `environment=${environment}`,
    '--field', `skip_tests=${skipTests}`,
    '--field', `force_deploy=${forceDeploy}`
  ];

  return new Promise((resolve, reject) => {
    const gh = spawn('gh', workflowArgs, { 
      stdio: ['pipe', 'pipe', 'pipe'] 
    });

    let output = '';
    let error = '';

    gh.stdout.on('data', (data) => {
      output += data.toString();
    });

    gh.stderr.on('data', (data) => {
      error += data.toString();
    });

    gh.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || 'GitHub CLI command failed'));
      }
    });

    gh.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Get current repository information
 */
function getRepoInfo() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return {
      name: packageJson.name || 'orangecat',
      version: packageJson.version || '0.1.0'
    };
  } catch (error) {
    return {
      name: 'orangecat',
      version: 'unknown'
    };
  }
}

/**
 * Show deployment monitoring information
 */
function showMonitoringInfo(environment) {
  const urls = {
    production: 'https://orangecat.ch',
    staging: 'https://staging-orangecat.vercel.app'
  };

  console.log(colors.success(`
✅ Deployment triggered successfully!

🔍 MONITORING:
   GitHub Actions: https://github.com/your-org/orangecat/actions
   Deployment URL: ${urls[environment]}
   Health Check: ${urls[environment]}/api/health

⏱️ TIMELINE:
   • Quality checks: ~2-3 minutes
   • Build & deploy: ~3-5 minutes
   • Health validation: ~1 minute
   • Total time: ~6-9 minutes

📱 You'll receive notifications when deployment completes.
   Watch the GitHub Actions tab for real-time progress.
  `));
}

/**
 * Main deployment function
 */
async function main() {
  showBanner();
  
  const options = parseArguments();
  
  if (options.help) {
    showHelp();
    return;
  }

  validateEnvironment(options.environment);
  
  const repoInfo = getRepoInfo();
  console.log(colors.dim(`Repository: ${repoInfo.name} v${repoInfo.version}`));
  
  // Check GitHub CLI
  console.log(colors.info('🔍 Checking GitHub CLI...'));
  const hasGitHubCLI = await checkGitHubCLI();
  
  if (!hasGitHubCLI) {
    console.log(colors.error(`
❌ GitHub CLI not found!

Please install GitHub CLI to use this script:
• Windows: winget install GitHub.cli
• macOS: brew install gh
• Linux: https://cli.github.com/

Alternative: Use GitHub Actions UI directly:
https://github.com/your-org/orangecat/actions/workflows/one-button-deploy.yml
    `));
    process.exit(1);
  }

  console.log(colors.success('✅ GitHub CLI found'));

  // Confirm deployment
  if (options.environment === 'production' && !options.forceDeploy) {
    console.log(colors.warning(`
⚠️  PRODUCTION DEPLOYMENT CONFIRMATION
This will deploy to the live production environment.
Press Ctrl+C to cancel, or Enter to continue...
    `));
    
    // Wait for user input
    await new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });
  }

  try {
    // Trigger deployment
    await triggerWorkflow(options);
    showMonitoringInfo(options.environment);
    
  } catch (error) {
    console.log(colors.error(`
❌ Deployment failed to trigger:
${error.message}

💡 Troubleshooting:
• Make sure you're authenticated: gh auth login
• Check repository permissions
• Verify workflow file exists: .github/workflows/one-button-deploy.yml

🔧 Manual trigger:
Visit: https://github.com/your-org/orangecat/actions
    `));
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.log(colors.error(`\n❌ Unhandled error: ${error.message}`));
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(colors.warning('\n\n🛑 Deployment cancelled by user'));
  process.exit(0);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 