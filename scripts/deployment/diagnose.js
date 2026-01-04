#!/usr/bin/env node

/**
 * 🔍 OrangeCat Deployment Diagnostics
 *
 * Diagnoses deployment issues and provides troubleshooting guidance.
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

// Colors
const colors = {
  title: chalk.bold.blue,
  success: chalk.bold.green,
  error: chalk.bold.red,
  warning: chalk.bold.yellow,
  info: chalk.cyan,
  dim: chalk.dim,
};

/**
 * Check system prerequisites
 */
function checkPrerequisites() {
  console.log(colors.title('\n🔧 Checking Prerequisites\n'));

  const checks = [
    {
      name: 'Node.js',
      command: 'node --version',
      required: true,
      pattern: /v(\d+)/,
      minVersion: 20,
    },
    {
      name: 'Git',
      command: 'git --version',
      required: true,
    },
    {
      name: 'GitHub CLI',
      command: 'gh --version',
      required: true,
    },
    {
      name: 'Vercel CLI',
      command: 'vercel --version',
      required: true,
    },
  ];

  let allGood = true;

  for (const check of checks) {
    try {
      const output = execSync(check.command, { encoding: 'utf8' });
      console.log(colors.success(`✅ ${check.name}: ${output.trim()}`));

      if (check.pattern && check.minVersion) {
        const match = output.match(check.pattern);
        if (match) {
          const version = parseInt(match[1]);
          if (version < check.minVersion) {
            console.log(
              colors.error(`❌ ${check.name} version too old. Required: ${check.minVersion}+`)
            );
            allGood = false;
          }
        }
      }
    } catch (error) {
      if (check.required) {
        console.log(colors.error(`❌ ${check.name}: Not found or not working`));
        allGood = false;
      } else {
        console.log(colors.warning(`⚠️ ${check.name}: Not found (optional)`));
      }
    }
  }

  return allGood;
}

/**
 * Check authentication
 */
function checkAuthentication() {
  console.log(colors.title('\n🔐 Checking Authentication\n'));

  const checks = [
    {
      name: 'GitHub CLI Auth',
      command: 'gh auth status',
      success: '✅ GitHub CLI authenticated',
    },
    {
      name: 'Vercel CLI Auth',
      command: 'vercel whoami',
      success: '✅ Vercel CLI authenticated',
    },
    {
      name: 'Git User',
      command: 'git config user.name',
      success: '✅ Git user configured',
    },
  ];

  let allGood = true;

  for (const check of checks) {
    try {
      const output = execSync(check.command, { encoding: 'utf8' });
      console.log(colors.success(check.success));
    } catch (error) {
      console.log(colors.error(`❌ ${check.name}: Not authenticated`));
      allGood = false;
    }
  }

  return allGood;
}

/**
 * Check project status
 */
function checkProjectStatus() {
  console.log(colors.title('\n📁 Checking Project Status\n'));

  const checks = [
    {
      name: 'Git Repository',
      command: 'git status --porcelain',
      validate: output => {
        if (output.trim()) {
          console.log(
            colors.info(`📝 Uncommitted changes: ${output.split('\n').length - 1} files`)
          );
        } else {
          console.log(colors.info('📝 Working directory clean'));
        }
        return true;
      },
    },
    {
      name: 'Current Branch',
      command: 'git branch --show-current',
      validate: output => {
        const branch = output.trim();
        if (branch === 'main') {
          console.log(colors.success(`✅ On main branch`));
        } else {
          console.log(colors.warning(`⚠️ On branch: ${branch} (should be main for deployment)`));
        }
        return true;
      },
    },
    {
      name: 'Dependencies',
      command: 'npm list --depth=0',
      validate: output => {
        console.log(colors.success('✅ Dependencies installed'));
        return true;
      },
    },
  ];

  let allGood = true;

  for (const check of checks) {
    try {
      const output = execSync(check.command, { encoding: 'utf8' });
      if (check.validate) {
        check.validate(output);
      }
    } catch (error) {
      console.log(colors.error(`❌ ${check.name}: ${error.message}`));
      allGood = false;
    }
  }

  return allGood;
}

/**
 * Check deployment configuration
 */
function checkDeploymentConfig() {
  console.log(colors.title('\n⚙️ Checking Deployment Configuration\n'));

  const checks = [
    {
      name: 'GitHub Workflow',
      path: '.github/workflows/one-button-deploy.yml',
      validate: content => {
        if (content.includes('one-button-deploy.yml')) {
          console.log(colors.success('✅ GitHub workflow configured'));
        } else {
          console.log(colors.warning('⚠️ GitHub workflow may be misconfigured'));
        }
      },
    },
    {
      name: 'Package Scripts',
      validate: () => {
        try {
          const pkg = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }));
          if (pkg.scripts && pkg.scripts.deploy) {
            console.log(colors.success('✅ Deploy script configured'));
          } else {
            console.log(colors.error('❌ Deploy script not found in package.json'));
            return false;
          }
        } catch (error) {
          console.log(colors.error('❌ Could not read package.json'));
          return false;
        }
        return true;
      },
    },
  ];

  let allGood = true;

  for (const check of checks) {
    try {
      let content = '';
      if (check.path) {
        content = execSync(`cat ${check.path}`, { encoding: 'utf8' });
      }

      if (check.validate) {
        const result = check.validate(content);
        if (result === false) allGood = false;
      }
    } catch (error) {
      console.log(colors.error(`❌ ${check.name}: ${error.message}`));
      allGood = false;
    }
  }

  return allGood;
}

/**
 * Check production status
 */
function checkProductionStatus() {
  console.log(colors.title('\n🌐 Checking Production Status\n'));

  const productionUrl = 'https://www.orangecat.ch';

  try {
    const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${productionUrl}`, {
      encoding: 'utf8',
    });
    if (response.trim() === '200') {
      console.log(colors.success(`✅ Production site accessible: ${productionUrl}`));
    } else {
      console.log(colors.error(`❌ Production site returned HTTP ${response}`));
      return false;
    }
  } catch (error) {
    console.log(colors.error(`❌ Could not reach production site: ${error.message}`));
    return false;
  }

  // Check health endpoint
  try {
    const healthResponse = execSync(
      `curl -s -o /dev/null -w "%{http_code}" ${productionUrl}/api/health`,
      { encoding: 'utf8' }
    );
    if (healthResponse.trim() === '200') {
      console.log(colors.success('✅ Health endpoint responding'));
    } else {
      console.log(colors.warning(`⚠️ Health endpoint returned HTTP ${healthResponse}`));
    }
  } catch (error) {
    console.log(colors.warning('⚠️ Health endpoint not accessible'));
  }

  return true;
}

/**
 * Provide recommendations
 */
function provideRecommendations(prereqOk, authOk, projectOk, configOk, prodOk) {
  console.log(colors.title('\n💡 Recommendations\n'));

  const recommendations = [];

  if (!prereqOk) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Install missing prerequisites (Node.js, GitHub CLI, Vercel CLI)',
      action: 'Check docs/deployment/DEPLOYMENT_PROCESS.md for installation instructions',
    });
  }

  if (!authOk) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Complete authentication setup',
      action: 'Run: gh auth login && vercel login',
    });
  }

  if (!projectOk) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Fix project issues',
      action: 'Commit changes, switch to main branch, install dependencies',
    });
  }

  if (!configOk) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Fix deployment configuration',
      action: 'Check GitHub workflows and package.json scripts',
    });
  }

  if (!prodOk) {
    recommendations.push({
      priority: 'LOW',
      message: 'Investigate production issues',
      action: 'Check Vercel dashboard and GitHub Actions logs',
    });
  }

  if (recommendations.length === 0) {
    console.log(colors.success('🎉 All checks passed! Ready to deploy.'));
    console.log(colors.info('Run: npm run deploy'));
  } else {
    recommendations.forEach((rec, index) => {
      const color =
        rec.priority === 'HIGH'
          ? colors.error
          : rec.priority === 'MEDIUM'
            ? colors.warning
            : colors.info;
      console.log(color(`${index + 1}. [${rec.priority}] ${rec.message}`));
      console.log(colors.dim(`   ${rec.action}`));
    });
  }
}

/**
 * Main diagnostic function
 */
async function main() {
  console.log(colors.title('🔍 OrangeCat Deployment Diagnostics'));
  console.log(colors.dim('=====================================\n'));

  const prereqOk = checkPrerequisites();
  const authOk = checkAuthentication();
  const projectOk = checkProjectStatus();
  const configOk = checkDeploymentConfig();
  const prodOk = checkProductionStatus();

  provideRecommendations(prereqOk, authOk, projectOk, configOk, prodOk);

  const allOk = prereqOk && authOk && projectOk && configOk && prodOk;

  console.log(colors.title('\n📊 Summary'));
  console.log(`Prerequisites: ${prereqOk ? '✅' : '❌'}`);
  console.log(`Authentication: ${authOk ? '✅' : '❌'}`);
  console.log(`Project Status: ${projectOk ? '✅' : '❌'}`);
  console.log(`Configuration: ${configOk ? '✅' : '❌'}`);
  console.log(`Production: ${prodOk ? '✅' : '❌'}`);

  if (allOk) {
    console.log(colors.success('\n🎯 Deployment Ready!'));
    process.exit(0);
  } else {
    console.log(colors.error('\n🚨 Issues Found - Fix before deploying'));
    process.exit(1);
  }
}

// Run diagnostics
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(colors.error(`Diagnostics failed: ${error.message}`));
    process.exit(1);
  });
}



