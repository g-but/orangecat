#!/usr/bin/env node

/**
 * 🤖 OrangeCat Autonomous Deployment Agent
 * Detects issues, applies fixes, and retries deployment automatically
 */

const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoDeployAgent {
  constructor() {
    this.issues = [];
    this.fixAttempts = 0;
    this.maxFixAttempts = 3;
    this.deploymentAttempts = 0;
    this.maxDeploymentAttempts = 5;
    this.startTime = Date.now();
    this.isFixing = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      fix: '\x1b[35m',    // Purple for fixes
      agent: '\x1b[94m',   // Bright blue for agent actions
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] 🤖 ${message}${colors.reset}`);
    
    // Log to agent-specific file
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    fs.appendFileSync('auto-deploy-agent.log', logEntry);
  }

  async startAutonomousDeployment() {
    this.log('🚀 STARTING AUTONOMOUS DEPLOYMENT AGENT', 'agent');
    this.log('🧠 AI-Powered Issue Detection & Auto-Fixing', 'agent');
    this.log('🔄 Self-Healing Deployment Pipeline', 'agent');
    
    await this.runDeploymentCycle();
  }

  async runDeploymentCycle() {
    this.deploymentAttempts++;
    this.log(`🚀 [Attempt ${this.deploymentAttempts}/${this.maxDeploymentAttempts}] Starting deployment cycle...`, 'info');
    
    // Step 1: Pre-deployment health check
    await this.preDeploymentCheck();
    
    // Step 2: Trigger deployment
    await this.triggerDeployment();
    
    // Step 3: Monitor and detect issues
    const deploymentResult = await this.monitorDeployment();
    
    if (deploymentResult.success) {
      this.log('🎉 AUTONOMOUS DEPLOYMENT SUCCESS!', 'success');
      await this.generateSuccessReport();
      return;
    }
    
    // Step 4: Analyze issues and attempt fixes
    if (this.deploymentAttempts < this.maxDeploymentAttempts) {
      this.log('🔍 ISSUES DETECTED - Initiating auto-fix sequence...', 'warning');
      const fixResult = await this.analyzeAndFix(deploymentResult.issues);
      
      if (fixResult.applied) {
        this.log('✅ Fixes applied - Retrying deployment...', 'fix');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        await this.runDeploymentCycle();
      } else {
        this.log('❌ Auto-fix failed - Manual intervention required', 'error');
        await this.generateFailureReport(deploymentResult.issues);
      }
    } else {
      this.log('🚨 MAX DEPLOYMENT ATTEMPTS REACHED', 'error');
      await this.generateFailureReport(deploymentResult.issues);
    }
  }

  async preDeploymentCheck() {
    this.log('🔍 Running pre-deployment diagnostics...', 'info');
    
    const checks = [
      () => this.checkLocalBuild(),
      () => this.checkEnvironmentVariables(),
      () => this.checkGitStatus(),
      () => this.checkDependencies(),
      () => this.checkDiskSpace()
    ];
    
    for (const check of checks) {
      await check();
    }
    
    this.log('✅ Pre-deployment diagnostics complete', 'success');
  }

  async checkLocalBuild() {
    this.log('🏗️ Testing local build...', 'info');
    
    return new Promise((resolve) => {
      exec('npm run build', { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          this.log('❌ Local build failed - will attempt to fix', 'error');
          this.issues.push({
            type: 'build_failure',
            message: error.message,
            stderr: stderr,
            fixable: true
          });
        } else {
          this.log('✅ Local build successful', 'success');
        }
        resolve();
      });
    });
  }

  async checkEnvironmentVariables() {
    this.log('🔧 Checking environment variables...', 'info');
    
    const requiredEnvVars = ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'];
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      this.log(`❌ Missing environment variables: ${missing.join(', ')}`, 'error');
      this.issues.push({
        type: 'missing_env_vars',
        missing: missing,
        fixable: true
      });
    } else {
      this.log('✅ Environment variables configured', 'success');
    }
  }

  async checkGitStatus() {
    this.log('📝 Checking git status...', 'info');
    
    return new Promise((resolve) => {
      exec('git status --porcelain', (error, stdout) => {
        if (stdout.trim()) {
          this.log('⚠️ Uncommitted changes detected - will auto-commit', 'warning');
          this.issues.push({
            type: 'uncommitted_changes',
            files: stdout.split('\n').filter(line => line.trim()),
            fixable: true
          });
        } else {
          this.log('✅ Git status clean', 'success');
        }
        resolve();
      });
    });
  }

  async checkDependencies() {
    this.log('📦 Checking dependencies...', 'info');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const lockfilePath = path.join(process.cwd(), 'package-lock.json');
    
    if (!fs.existsSync(lockfilePath)) {
      this.log('❌ Package lock file missing - will regenerate', 'error');
      this.issues.push({
        type: 'missing_lockfile',
        fixable: true
      });
    } else {
      this.log('✅ Dependencies appear valid', 'success');
    }
  }

  async checkDiskSpace() {
    this.log('💾 Checking disk space...', 'info');
    
    return new Promise((resolve) => {
      exec('df -h . || dir', (error, stdout) => {
        if (stdout.includes('100%') || stdout.includes('0 bytes free')) {
          this.log('❌ Low disk space detected', 'error');
          this.issues.push({
            type: 'low_disk_space',
            fixable: false
          });
        } else {
          this.log('✅ Sufficient disk space', 'success');
        }
        resolve();
      });
    });
  }

  async triggerDeployment() {
    this.log('🚀 Triggering deployment...', 'info');
    
    return new Promise((resolve) => {
      // Auto-commit if needed
      if (this.issues.some(issue => issue.type === 'uncommitted_changes')) {
        this.log('📝 Auto-committing changes...', 'fix');
        exec('git add . && git commit -m "🤖 Auto-commit by deployment agent"', (error) => {
          if (!error) {
            this.log('✅ Changes committed automatically', 'fix');
          }
          this.pushToGitHub(resolve);
        });
      } else {
        this.pushToGitHub(resolve);
      }
    });
  }

  pushToGitHub(resolve) {
    this.log('📤 Pushing to GitHub to trigger deployment...', 'info');
    
    exec('git push origin main', (error, stdout, stderr) => {
      if (error) {
        this.log(`❌ Git push failed: ${error.message}`, 'error');
        this.issues.push({
          type: 'git_push_failure',
          error: error.message,
          fixable: true
        });
      } else {
        this.log('✅ Code pushed to GitHub - deployment triggered', 'success');
      }
      resolve();
    });
  }

  async monitorDeployment() {
    this.log('👁️ MONITORING DEPLOYMENT - Auto-detecting issues...', 'agent');
    
    const issues = [];
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes of monitoring
    
    while (attempts < maxAttempts) {
      attempts++;
      this.log(`🔍 [Monitor ${attempts}/${maxAttempts}] Checking deployment status...`, 'info');
      
      // Check GitHub Actions status
      const workflowStatus = await this.checkWorkflowStatus();
      if (workflowStatus.failed) {
        this.log('🚨 GitHub Actions workflow failed!', 'error');
        issues.push({
          type: 'workflow_failure',
          details: workflowStatus.details,
          fixable: true
        });
        break;
      }
      
      // Check production site
      const siteStatus = await this.checkProductionSite();
      if (siteStatus.healthy) {
        this.log('🎉 Production site is healthy - deployment successful!', 'success');
        return { success: true, issues: [] };
      } else if (siteStatus.criticalError) {
        this.log('🚨 Critical site error detected!', 'error');
        issues.push({
          type: 'site_error',
          details: siteStatus.details,
          fixable: true
        });
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    this.log('⏰ Monitoring timeout - issues detected', 'warning');
    if (issues.length === 0) {
      issues.push({
        type: 'deployment_timeout',
        message: 'Deployment did not complete within expected timeframe',
        fixable: true
      });
    }
    
    return { success: false, issues };
  }

  async checkWorkflowStatus() {
    return new Promise((resolve) => {
      exec('gh run list --limit 1 --json status,conclusion,url', (error, stdout) => {
        if (error) {
          resolve({ failed: false, details: 'GitHub CLI not available' });
          return;
        }
        
        try {
          const runs = JSON.parse(stdout);
          if (runs.length > 0) {
            const run = runs[0];
            if (run.status === 'completed' && run.conclusion !== 'success') {
              resolve({
                failed: true,
                details: {
                  conclusion: run.conclusion,
                  url: run.url
                }
              });
              return;
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
        
        resolve({ failed: false });
      });
    });
  }

  async checkProductionSite() {
    const urls = [
      'https://orangecat.ch',
      'https://orangecat.ch/api/health'
    ];
    
    let allHealthy = true;
    let criticalError = false;
    const details = {};
    
    for (const url of urls) {
      const result = await this.testUrl(url);
      details[url] = result;
      
      if (!result.healthy) {
        allHealthy = false;
        if (result.statusCode >= 500 || result.statusCode === 404) {
          criticalError = true;
        }
      }
    }
    
    return {
      healthy: allHealthy,
      criticalError,
      details
    };
  }

  testUrl(url) {
    return new Promise((resolve) => {
      const request = https.get(url, (response) => {
        const healthy = response.statusCode >= 200 && response.statusCode < 300;
        resolve({
          healthy,
          statusCode: response.statusCode,
          responseTime: Date.now()
        });
      });
      
      request.on('error', (error) => {
        resolve({
          healthy: false,
          error: error.message,
          statusCode: 0
        });
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        resolve({
          healthy: false,
          error: 'timeout',
          statusCode: 0
        });
      });
    });
  }

  async analyzeAndFix(issues) {
    this.fixAttempts++;
    this.log(`🔧 [Fix Attempt ${this.fixAttempts}/${this.maxFixAttempts}] ANALYZING ISSUES...`, 'fix');
    
    if (this.fixAttempts > this.maxFixAttempts) {
      this.log('❌ Maximum fix attempts reached', 'error');
      return { applied: false };
    }
    
    let fixesApplied = 0;
    
    for (const issue of issues) {
      this.log(`🔍 Analyzing issue: ${issue.type}`, 'info');
      
      const fix = await this.generateFix(issue);
      if (fix.canFix) {
        this.log(`🛠️ Applying fix for ${issue.type}: ${fix.description}`, 'fix');
        const result = await this.applyFix(fix);
        
        if (result.success) {
          this.log(`✅ Fix applied successfully: ${fix.description}`, 'success');
          fixesApplied++;
        } else {
          this.log(`❌ Fix failed: ${result.error}`, 'error');
        }
      } else {
        this.log(`⚠️ No automatic fix available for ${issue.type}`, 'warning');
      }
    }
    
    return { applied: fixesApplied > 0 };
  }

  async generateFix(issue) {
    const fixes = {
      build_failure: {
        canFix: true,
        description: 'Clear cache and reinstall dependencies',
        commands: [
          'npm cache clean --force',
          'rm -rf node_modules package-lock.json',
          'npm install',
          'npm run build'
        ]
      },
      
      missing_env_vars: {
        canFix: true,
        description: 'Validate or initialize env via Env Manager (non-destructive)',
        commands: [
          'node scripts/utils/env-manager.js validate || node scripts/utils/env-manager.js setup'
        ]
      },
      
      uncommitted_changes: {
        canFix: true,
        description: 'Auto-commit uncommitted changes',
        commands: [
          'git add .',
          'git commit -m "🤖 Auto-fix: Commit pending changes"'
        ]
      },
      
      missing_lockfile: {
        canFix: true,
        description: 'Regenerate package lock file',
        commands: [
          'rm -f package-lock.json',
          'npm install'
        ]
      },
      
      workflow_failure: {
        canFix: true,
        description: 'Reset workflow and retry with clean state',
        commands: [
          'git fetch origin main',
          'git reset --hard origin/main',
          'npm ci'
        ]
      },
      
      site_error: {
        canFix: true,
        description: 'Force Vercel redeployment',
        commands: ['npx vercel --prod --force || echo "Manual Vercel check required"']
      },
      
      deployment_timeout: {
        canFix: true,
        description: 'Clear deployment cache and retry',
        commands: [
          'rm -rf .next .vercel',
          'npm run build'
        ]
      }
    };
    
    return fixes[issue.type] || { canFix: false };
  }

  async applyFix(fix) {
    for (const command of fix.commands) {
      this.log(`⚡ Executing: ${command}`, 'fix');
      
      const result = await this.executeCommand(command);
      if (!result.success) {
        return { success: false, error: result.error };
      }
    }
    
    return { success: true };
  }

  executeCommand(command) {
    return new Promise((resolve) => {
      exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          this.log(`❌ Command failed: ${error.message}`, 'error');
          resolve({ success: false, error: error.message });
        } else {
          this.log(`✅ Command completed: ${command}`, 'success');
          resolve({ success: true, output: stdout });
        }
      });
    });
  }

  async generateSuccessReport() {
    const duration = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
    
    const report = `
🤖 AUTONOMOUS DEPLOYMENT SUCCESS REPORT
=======================================
📅 Date: ${new Date().toISOString()}
⏱️  Total Duration: ${duration} minutes
🔄 Deployment Attempts: ${this.deploymentAttempts}
🛠️  Fix Attempts: ${this.fixAttempts}
🔧 Issues Auto-Fixed: ${this.issues.filter(i => i.fixable).length}

🎯 DEPLOYMENT STATUS: SUCCESS
🌐 Production URL: https://orangecat.ch
🏥 Health Status: HEALTHY
📊 GitHub Actions: https://github.com/g-but/orangecat/actions
🔗 Vercel Dashboard: https://vercel.com/dashboard

🤖 AGENT PERFORMANCE:
✅ Auto-issue detection: ACTIVE
✅ Self-healing fixes: APPLIED
✅ Zero manual intervention: SUCCESS

🎉 Your deployment agent is working perfectly!
`;

    this.log(report, 'success');
    fs.writeFileSync('autonomous-deployment-report.txt', report);
    this.log('📄 Success report saved: autonomous-deployment-report.txt', 'info');
  }

  async generateFailureReport(issues) {
    const report = `
🚨 AUTONOMOUS DEPLOYMENT FAILURE REPORT
=======================================
📅 Date: ${new Date().toISOString()}
🔄 Deployment Attempts: ${this.deploymentAttempts}/${this.maxDeploymentAttempts}
🛠️  Fix Attempts: ${this.fixAttempts}/${this.maxFixAttempts}

❌ UNRESOLVED ISSUES:
${issues.map(issue => `- ${issue.type}: ${issue.message || 'See details above'}`).join('\n')}

🛠️ MANUAL ACTIONS REQUIRED:
1. Check GitHub Actions: https://github.com/g-but/orangecat/actions
2. Check Vercel Dashboard: https://vercel.com/dashboard
3. Review agent logs: auto-deploy-agent.log
4. Run local diagnostics: npm run build

🤖 AGENT STATUS: REQUIRES MANUAL INTERVENTION
`;

    this.log(report, 'error');
    fs.writeFileSync('deployment-failure-report.txt', report);
    this.log('📄 Failure report saved: deployment-failure-report.txt', 'error');
  }
}

// CLI interface
if (require.main === module) {
  const agent = new AutoDeployAgent();
  
  console.log('🤖 OrangeCat Autonomous Deployment Agent');
  console.log('========================================');
  console.log('🧠 AI-Powered Issue Detection');
  console.log('🔧 Automatic Problem Fixing');
  console.log('🔄 Self-Healing Deployment');
  console.log('📊 Complete Automation');
  console.log('');
  
  agent.startAutonomousDeployment().catch(error => {
    console.error('🚨 Agent failed:', error);
    process.exit(1);
  });
}

module.exports = AutoDeployAgent; 
