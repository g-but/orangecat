#!/usr/bin/env node

/**
 * 🔍 OrangeCat Deployment Setup Verification
 * 
 * This script verifies that all components of the one-button deployment
 * system are properly configured and ready for use.
 */

import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import chalk from 'chalk';

const colors = {
  success: chalk.bold.green,
  error: chalk.bold.red,
  warning: chalk.bold.yellow,
  info: chalk.cyan,
  title: chalk.bold.blue
};

/**
 * Check if a file exists
 */
function checkFile(path, description) {
  const exists = existsSync(path);
  console.log(exists 
    ? colors.success(`✅ ${description}`)
    : colors.error(`❌ ${description} (Missing: ${path})`)
  );
  return exists;
}

/**
 * Check GitHub CLI installation
 */
async function checkGitHubCLI() {
  return new Promise((resolve) => {
    const gh = spawn('gh', ['--version'], { stdio: 'pipe' });
    
    gh.on('close', (code) => {
      const installed = code === 0;
      console.log(installed
        ? colors.success('✅ GitHub CLI installed')
        : colors.warning('⚠️  GitHub CLI not installed (CLI deployment unavailable)')
      );
      resolve(installed);
    });
    
    gh.on('error', () => {
      console.log(colors.warning('⚠️  GitHub CLI not installed (CLI deployment unavailable)'));
      resolve(false);
    });
  });
}

/**
 * Check Node.js and npm
 */
function checkNodeEnvironment() {
  try {
    const nodeVersion = process.version;
    console.log(colors.success(`✅ Node.js ${nodeVersion}`));
    
    // Check package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const hasDeployScripts = packageJson.scripts['deploy:button'] && 
                             packageJson.scripts['deploy:production'];
    
    console.log(hasDeployScripts
      ? colors.success('✅ Deployment scripts configured')
      : colors.error('❌ Deployment scripts missing')
    );
    
    return hasDeployScripts;
  } catch (error) {
    console.log(colors.error('❌ Node.js environment issue'));
    return false;
  }
}

/**
 * Check Vercel configuration
 */
function checkVercelConfig() {
  const hasConfig = checkFile('vercel.json', 'Vercel configuration');
  
  if (hasConfig) {
    try {
      const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
      const hasAlias = config.alias && config.alias.includes('orangecat.ch');
      
      console.log(hasAlias
        ? colors.success('✅ Production domain configured (orangecat.ch)')
        : colors.warning('⚠️  Production domain not configured')
      );
      
      return hasAlias;
    } catch (error) {
      console.log(colors.error('❌ Vercel config invalid JSON'));
      return false;
    }
  }
  
  return false;
}

/**
 * Check GitHub Actions workflow
 */
function checkGitHubActions() {
  const workflowExists = checkFile(
    '.github/workflows/one-button-deploy.yml',
    'One-button deployment workflow'
  );
  
  // Check for conflicting workflows
  const conflictingWorkflows = [
    '.github/workflows/smart-deploy.yml',
    '.github/workflows/production-deploy.yml'
  ];
  
  let hasConflicts = false;
  conflictingWorkflows.forEach(workflow => {
    if (existsSync(workflow)) {
      console.log(colors.warning(`⚠️  Conflicting workflow: ${workflow}`));
      hasConflicts = true;
    }
  });
  
  if (!hasConflicts) {
    console.log(colors.success('✅ No conflicting workflows'));
  }
  
  return workflowExists && !hasConflicts;
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const optionalEnvVars = [
    'NEXT_PUBLIC_BITCOIN_ADDRESS',
    'NEXT_PUBLIC_LIGHTNING_ADDRESS'
  ];
  
  console.log(colors.info('\n🔍 Environment Variables:'));
  
  let hasRequired = true;
  requiredEnvVars.forEach(envVar => {
    const hasVar = process.env[envVar];
    console.log(hasVar
      ? colors.success(`✅ ${envVar}`)
      : colors.error(`❌ ${envVar} (Required)`)
    );
    if (!hasVar) hasRequired = false;
  });
  
  optionalEnvVars.forEach(envVar => {
    const hasVar = process.env[envVar];
    console.log(hasVar
      ? colors.success(`✅ ${envVar}`)
      : colors.warning(`⚠️  ${envVar} (Optional)`)
    );
  });
  
  return hasRequired;
}

/**
 * Check Git repository
 */
function checkGitRepository() {
  const isGitRepo = existsSync('.git');
  console.log(isGitRepo
    ? colors.success('✅ Git repository initialized')
    : colors.error('❌ Not a Git repository')
  );
  
  if (isGitRepo) {
    try {
      // Check if we're on main branch
      const fs = require('fs');
      const headRef = fs.readFileSync('.git/HEAD', 'utf8').trim();
      const isMainBranch = headRef.includes('refs/heads/main');
      
      console.log(isMainBranch
        ? colors.success('✅ On main branch')
        : colors.warning('⚠️  Not on main branch (consider switching for deployment)')
      );
    } catch (error) {
      console.log(colors.warning('⚠️  Could not determine current branch'));
    }
  }
  
  return isGitRepo;
}

/**
 * Provide setup recommendations
 */
function provideRecommendations(checks) {
  console.log(colors.title('\n🎯 Setup Recommendations:\n'));
  
  if (!checks.githubCLI) {
    console.log(colors.info(`
📦 Install GitHub CLI for command-line deployment:
   Windows: winget install GitHub.cli
   macOS: brew install gh
   Linux: https://cli.github.com/
   
   Then authenticate: gh auth login
    `));
  }
  
  if (!checks.workflow) {
    console.log(colors.info(`
🔧 GitHub Actions workflow is missing or has conflicts.
   The one-button-deploy.yml workflow should be the primary deployment method.
   Consider removing conflicting workflows.
    `));
  }
  
  if (!checks.environment) {
    console.log(colors.info(`
🔐 Missing required environment variables.
   Create .env.local file with required Supabase configuration.
   See docs/operations/DEPLOYMENT.md for details.
    `));
  }
  
  console.log(colors.info(`
🚀 Deployment Methods Available:
   1. GitHub Actions UI (no setup required)
      - Go to Actions tab → "🚀 One-Button Deploy" → "Run workflow"
   
   2. Command Line (requires GitHub CLI)
      - npm run deploy:production
      - npm run deploy:staging
      - npm run deploy:button
   
   3. Automatic (push to main)
      - Automatic deployment on push to main branch
    `));
}

/**
 * Main verification function
 */
async function main() {
  console.log(colors.title(`
╔══════════════════════════════════════════════════════════════╗
║           🔍 ORANGECAT DEPLOYMENT SETUP VERIFICATION         ║
╚══════════════════════════════════════════════════════════════╝
  `));
  
  console.log(colors.info('Checking deployment system configuration...\n'));
  
  // Run all checks
  const checks = {
    node: checkNodeEnvironment(),
    git: checkGitRepository(),
    vercel: checkVercelConfig(),
    workflow: checkGitHubActions(),
    environment: checkEnvironment(),
    githubCLI: await checkGitHubCLI()
  };
  
  // Summary
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  console.log(colors.title(`\n📊 Verification Results: ${passed}/${total} checks passed\n`));
  
  if (passed === total) {
    console.log(colors.success(`
🎉 DEPLOYMENT SYSTEM READY!
   
   All components are properly configured.
   You can deploy using any of the available methods.
   
   Quick deploy: npm run deploy:production
    `));
  } else if (passed >= total - 1) {
    console.log(colors.warning(`
⚠️  MOSTLY READY
   
   Deployment system is functional with minor issues.
   Check the recommendations below for optimization.
    `));
  } else {
    console.log(colors.error(`
❌ SETUP INCOMPLETE
   
   Several components need configuration.
   Please address the issues above before deploying.
    `));
  }
  
  provideRecommendations(checks);
}

// Run verification
main().catch(error => {
  console.log(colors.error(`\nVerification failed: ${error.message}`));
  process.exit(1);
}); 
