#!/usr/bin/env node

/**
 * 🚀 OrangeCat Deployment Monitor
 * Real-time deployment tracking with logs and status updates
 */

const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');

class DeploymentMonitor {
  constructor() {
    this.isMonitoring = false;
    this.deploymentUrl = null;
    this.startTime = Date.now();
    this.checkInterval = 10000; // 10 seconds
    this.maxChecks = 60; // 10 minutes total
    this.currentCheck = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green  
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    
    // Also log to file
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    fs.appendFileSync('deployment.log', logEntry);
  }

  async startMonitoring() {
    this.log('🚀 Starting COMPREHENSIVE deployment monitoring...', 'info');
    this.log('📊 Real-time GitHub Actions workflow tracking...', 'info');
    this.log('🔗 Vercel Dashboard: https://vercel.com/dashboard', 'info');
    this.log('📱 GitHub Actions: https://github.com/g-but/orangecat/actions', 'info');
    
    this.isMonitoring = true;
    
    // Always show key monitoring links
    this.displayMonitoringDashboard();
    
    // Check if GitHub CLI is available
    if (await this.checkGitHubCLI()) {
      await this.monitorGitHubActions();
    } else {
      this.log('⚠️ GitHub CLI not available. Switching to production site monitoring.', 'warning');
      this.log('💡 Install GitHub CLI for full workflow monitoring: gh auth login', 'info');
      await this.monitorProductionSite();
    }
  }

  async checkGitHubCLI() {
    return new Promise((resolve) => {
      exec('gh --version', (error) => {
        resolve(!error);
      });
    });
  }

  async monitorGitHubActions() {
    this.log('🔍 ACTIVE GitHub Actions workflow monitoring...', 'info');
    this.log('📊 Checking every 10 seconds for updates...', 'info');
    
    let lastStatus = '';
    let stepCount = 0;
    
    const checkWorkflow = () => {
      exec('gh run list --limit 1 --json status,conclusion,url,createdAt,jobs', (error, stdout) => {
        if (error) {
          this.log(`❌ GitHub CLI error: ${error.message}`, 'error');
          this.log('💡 Trying manual check - switch to production monitoring...', 'warning');
          this.monitorProductionSite();
          return;
        }

        try {
          const runs = JSON.parse(stdout);
          if (runs.length > 0) {
            const latestRun = runs[0];
            
            // Only log status changes to avoid spam
            if (latestRun.status !== lastStatus) {
              stepCount++;
              this.log(`🔄 [Step ${stepCount}] Workflow Status: ${latestRun.status.toUpperCase()}`, 'info');
              this.log(`🔗 Live Workflow: ${latestRun.url}`, 'info');
              lastStatus = latestRun.status;
            }
            
            if (latestRun.status === 'completed') {
              if (latestRun.conclusion === 'success') {
                this.log('🎉 DEPLOYMENT WORKFLOW SUCCESS!', 'success');
                this.log('✅ All quality gates passed', 'success');
                this.log('✅ Build completed successfully', 'success');
                this.log('✅ Vercel deployment triggered', 'success');
                this.log(`🔗 Full Workflow Details: ${latestRun.url}`, 'info');
                this.startProductionMonitoring();
              } else {
                this.log(`🚨 DEPLOYMENT WORKFLOW FAILED: ${latestRun.conclusion}`, 'error');
                this.handleWorkflowFailure(latestRun);
                this.stopMonitoring();
              }
            } else if (latestRun.status === 'in_progress') {
              this.log(`⏳ [Active] Deployment pipeline running... (${stepCount * 10}s elapsed)`, 'info');
              this.getWorkflowDetails(latestRun.url);
              setTimeout(checkWorkflow, this.checkInterval);
            } else if (latestRun.status === 'queued') {
              this.log('🔄 Deployment queued - waiting for runner...', 'info');
              setTimeout(checkWorkflow, this.checkInterval);
            }
          } else {
            this.log('⚠️ No recent workflows found - checking again...', 'warning');
            setTimeout(checkWorkflow, this.checkInterval);
          }
        } catch (parseError) {
          this.log(`❌ Failed to parse workflow data: ${parseError.message}`, 'error');
          this.log('🔄 Retrying in 10 seconds...', 'info');
          setTimeout(checkWorkflow, this.checkInterval);
        }
      });
    };

    checkWorkflow();
  }

  async startProductionMonitoring() {
    this.log('🌐 Starting production site monitoring...', 'info');
    this.log('🔗 Production URL: https://orangecat.ch', 'info');
    
    await this.monitorProductionSite();
  }

  async monitorProductionSite() {
    this.log('🌐 STARTING PRODUCTION SITE MONITORING', 'info');
    this.log('🔗 Vercel Project: https://vercel.com/g-but/orangecat', 'info');
    this.log('🔗 Production Site: https://orangecat.ch', 'info');
    this.log('🏥 Health Endpoint: https://orangecat.ch/api/health', 'info');
    
    const checkSite = async () => {
      this.currentCheck++;
      
      if (this.currentCheck > this.maxChecks) {
        this.log('⏰ MONITORING TIMEOUT - Final attempt failed', 'error');
        this.log('🆘 MANUAL CHECK REQUIRED:', 'error');
        this.log('   1. Check Vercel Dashboard: https://vercel.com/dashboard', 'error');
        this.log('   2. Check GitHub Actions: https://github.com/g-but/orangecat/actions', 'error');
        this.log('   3. Check site manually: https://orangecat.ch', 'error');
        this.stopMonitoring();
        return;
      }

      this.log(`🔍 [Check ${this.currentCheck}/${this.maxChecks}] Testing production endpoints...`, 'info');
      
      const progress = Math.round((this.currentCheck / this.maxChecks) * 100);
      this.log(`📊 Monitor Progress: ${progress}% complete`, 'info');

      try {
        // Check main site with detailed feedback
        this.log('🌐 Testing main site (https://orangecat.ch)...', 'info');
        const mainSiteStatus = await this.checkUrl('https://orangecat.ch');
        
        // Check API health with detailed feedback
        this.log('🏥 Testing health API (/api/health)...', 'info');
        const apiHealthStatus = await this.checkUrl('https://orangecat.ch/api/health');
        
        if (mainSiteStatus && apiHealthStatus) {
          this.log('🎉 SUCCESS! Production site is fully operational!', 'success');
          this.log('✅ Main site: RESPONSIVE', 'success');
          this.log('✅ Health API: HEALTHY', 'success');
          this.log('✅ Deployment: COMPLETE', 'success');
          await this.generateStatusReport();
          this.stopMonitoring();
        } else {
          if (!mainSiteStatus) {
            this.log('⚠️ Main site not responsive - likely still deploying...', 'warning');
            this.log('💡 Vercel deployment may be in progress', 'info');
          }
          if (!apiHealthStatus) {
            this.log('⚠️ Health API not ready - backend still initializing...', 'warning');
            this.log('💡 Database connections may be starting up', 'info');
          }
          this.log(`🔄 Retrying in 10 seconds... (${this.maxChecks - this.currentCheck} attempts left)`, 'info');
          setTimeout(checkSite, this.checkInterval);
        }
      } catch (error) {
        this.log(`❌ Error during site check: ${error.message}`, 'error');
        this.log('🔄 Network issue - retrying...', 'warning');
        setTimeout(checkSite, this.checkInterval);
      }
    };

    await checkSite();
  }

  checkUrl(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const request = https.get(url, (response) => {
        const responseTime = Date.now() - startTime;
        const statusOk = response.statusCode >= 200 && response.statusCode < 300;
        
        if (statusOk) {
          this.log(`✅ ${url}: HTTP ${response.statusCode} (${responseTime}ms)`, 'success');
          
          // Try to read response body for additional info
          let body = '';
          response.on('data', chunk => body += chunk);
          response.on('end', () => {
            if (url.includes('/api/health') && body) {
              try {
                const healthData = JSON.parse(body);
                this.log(`🏥 Health Status: ${JSON.stringify(healthData)}`, 'success');
              } catch (e) {
                this.log(`🏥 Health Response: ${body.substring(0, 100)}...`, 'info');
              }
            }
          });
        } else {
          this.log(`❌ ${url}: HTTP ${response.statusCode} (${responseTime}ms)`, 'error');
          if (response.statusCode === 404) {
            this.log('💡 404 Error - Site may not be deployed yet', 'warning');
          } else if (response.statusCode >= 500) {
            this.log('💡 Server Error - Backend issues, checking Vercel logs recommended', 'warning');
          }
        }
        
        resolve(statusOk);
      });

      request.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        this.log(`❌ ${url}: ${error.message} (${responseTime}ms)`, 'error');
        
        if (error.code === 'ENOTFOUND') {
          this.log('💡 DNS Resolution failed - domain may not be configured', 'warning');
        } else if (error.code === 'ECONNREFUSED') {
          this.log('💡 Connection refused - service not running yet', 'warning');
        } else if (error.code === 'ETIMEDOUT') {
          this.log('💡 Connection timeout - slow deployment or network issues', 'warning');
        }
        
        resolve(false);
      });

      request.setTimeout(10000, () => {
        this.log(`⏰ ${url}: Request timeout (10s) - site may be slow to respond`, 'warning');
        request.destroy();
        resolve(false);
      });
    });
  }

  displayMonitoringDashboard() {
    this.log('', 'info');
    this.log('📊 LIVE MONITORING DASHBOARD', 'info');
    this.log('═══════════════════════════════', 'info');
    this.log('🔗 GitHub Actions: https://github.com/g-but/orangecat/actions', 'info');
    this.log('🔗 Vercel Dashboard: https://vercel.com/dashboard', 'info');
    this.log('🔗 Vercel Project: https://vercel.com/g-but/orangecat', 'info');
    this.log('🔗 Production Site: https://orangecat.ch', 'info');
    this.log('🔗 Health Check: https://orangecat.ch/api/health', 'info');
    this.log('═══════════════════════════════', 'info');
    this.log('', 'info');
  }

  handleWorkflowFailure(run) {
    this.log('🚨 DEPLOYMENT FAILURE ANALYSIS', 'error');
    this.log('═══════════════════════════════', 'error');
    
    switch (run.conclusion) {
      case 'failure':
        this.log('❌ Build or deployment step failed', 'error');
        this.log('🔍 TROUBLESHOOTING STEPS:', 'error');
        this.log('   1. Check build logs in GitHub Actions', 'error');
        this.log('   2. Look for TypeScript errors', 'error');
        this.log('   3. Verify environment variables', 'error');
        this.log('   4. Check Vercel deployment logs', 'error');
        break;
      case 'cancelled':
        this.log('⏹️ Deployment was cancelled', 'warning');
        this.log('💡 Possible reasons: Manual cancellation or timeout', 'info');
        break;
      case 'timed_out':
        this.log('⏰ Deployment timed out (30 min limit)', 'error');
        this.log('🔍 LIKELY ISSUES:', 'error');
        this.log('   1. Very large build taking too long', 'error');
        this.log('   2. Hanging tests or processes', 'error');
        this.log('   3. Network issues during deployment', 'error');
        break;
      default:
        this.log(`❓ Unknown failure: ${run.conclusion}`, 'error');
    }
    
    this.log('', 'error');
    this.log('🛠️ IMMEDIATE ACTIONS:', 'error');
    this.log(`   1. Open workflow: ${run.url}`, 'error');
    this.log('   2. Check Vercel dashboard for deployment status', 'error');
    this.log('   3. Review the last commit for potential issues', 'error');
    this.log('   4. Run local build to reproduce error: npm run build', 'error');
    this.log('═══════════════════════════════', 'error');
  }

  getWorkflowDetails(workflowUrl) {
    // Get additional workflow details if possible
    exec('gh run view --json steps', (error, stdout) => {
      if (!error && stdout) {
        try {
          const workflowData = JSON.parse(stdout);
          if (workflowData.steps) {
            const currentStep = workflowData.steps.find(step => step.status === 'in_progress');
            if (currentStep) {
              this.log(`🔄 Current Step: ${currentStep.name}`, 'info');
            }
            
            const completedSteps = workflowData.steps.filter(step => step.status === 'completed');
            this.log(`✅ Completed Steps: ${completedSteps.length}/${workflowData.steps.length}`, 'info');
          }
        } catch (e) {
          // Silently fail - this is just bonus info
        }
      }
    });
  }

  async generateStatusReport() {
    const duration = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
    
    const report = `
🎯 DEPLOYMENT STATUS REPORT
===========================
📅 Date: ${new Date().toISOString()}
⏱️  Duration: ${duration} minutes
🔍 Health Checks: ${this.currentCheck}
🌐 Production URL: https://orangecat.ch
🏥 Health API: https://orangecat.ch/api/health
📊 GitHub Actions: https://github.com/g-but/orangecat/actions

✅ Status: DEPLOYMENT SUCCESSFUL
🎉 OrangeCat is live and healthy!
`;

    this.log(report, 'success');
    
    // Save report to file
    fs.writeFileSync('deployment-status.txt', report);
    this.log('📄 Status report saved to deployment-status.txt', 'info');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.log('🛑 Deployment monitoring stopped', 'info');
    
    // Open monitoring dashboard
    this.openMonitoringDashboard();
  }

  openMonitoringDashboard() {
    const urls = [
      'https://github.com/g-but/orangecat/actions',
      'https://orangecat.ch',
      'https://orangecat.ch/api/health'
    ];

    this.log('🔍 Opening monitoring dashboard...', 'info');
    
    // Try to open URLs based on platform
    const platform = process.platform;
    const openCommand = platform === 'win32' ? 'start' : 
                       platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${openCommand} "${urls[0]}"`, (error) => {
      if (error) {
        this.log(`📱 Monitor deployment: ${urls[0]}`, 'info');
        this.log(`🌐 Production site: ${urls[1]}`, 'info');
        this.log(`🏥 Health check: ${urls[2]}`, 'info');
      }
    });
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new DeploymentMonitor();
  
  console.log('🚀 OrangeCat Deployment Monitor');
  console.log('===============================');
  console.log('📊 Real-time deployment tracking');
  console.log('🔍 Health monitoring');
  console.log('📱 Automatic dashboard opening');
  console.log('');
  
  monitor.startMonitoring().catch(error => {
    console.error('❌ Monitor failed:', error);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Monitoring interrupted by user');
    monitor.stopMonitoring();
    process.exit(0);
  });
}

module.exports = DeploymentMonitor; 