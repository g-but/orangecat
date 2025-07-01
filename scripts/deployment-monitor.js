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
    this.log('🚀 Starting deployment monitoring...', 'info');
    this.log('📊 Monitoring GitHub Actions workflow...', 'info');
    
    this.isMonitoring = true;
    
    // Check if GitHub CLI is available
    if (await this.checkGitHubCLI()) {
      await this.monitorGitHubActions();
    } else {
      this.log('⚠️ GitHub CLI not available. Monitoring production site only.', 'warning');
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
    this.log('🔍 Checking GitHub Actions workflow status...', 'info');
    
    const checkWorkflow = () => {
      exec('gh run list --limit 1 --json status,conclusion,url,createdAt', (error, stdout) => {
        if (error) {
          this.log(`❌ Failed to check workflow: ${error.message}`, 'error');
          return;
        }

        try {
          const runs = JSON.parse(stdout);
          if (runs.length > 0) {
            const latestRun = runs[0];
            this.log(`📋 Workflow Status: ${latestRun.status}`, 'info');
            
            if (latestRun.status === 'completed') {
              if (latestRun.conclusion === 'success') {
                this.log('✅ Deployment workflow completed successfully!', 'success');
                this.log(`🔗 Workflow URL: ${latestRun.url}`, 'info');
                this.startProductionMonitoring();
              } else {
                this.log(`❌ Deployment workflow failed: ${latestRun.conclusion}`, 'error');
                this.log(`🔗 Check details: ${latestRun.url}`, 'error');
                this.stopMonitoring();
              }
            } else if (latestRun.status === 'in_progress') {
              this.log('⏳ Deployment in progress...', 'info');
              setTimeout(checkWorkflow, this.checkInterval);
            }
          }
        } catch (parseError) {
          this.log(`❌ Failed to parse workflow data: ${parseError.message}`, 'error');
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
    const checkSite = async () => {
      this.currentCheck++;
      
      if (this.currentCheck > this.maxChecks) {
        this.log('⏰ Monitoring timeout reached', 'warning');
        this.stopMonitoring();
        return;
      }

      this.log(`🔍 Health check ${this.currentCheck}/${this.maxChecks}`, 'info');

      try {
        // Check main site
        const mainSiteStatus = await this.checkUrl('https://orangecat.ch');
        
        // Check API health
        const apiHealthStatus = await this.checkUrl('https://orangecat.ch/api/health');
        
        if (mainSiteStatus && apiHealthStatus) {
          this.log('✅ Production site is healthy!', 'success');
          this.log('🎉 Deployment monitoring complete', 'success');
          await this.generateStatusReport();
          this.stopMonitoring();
        } else {
          this.log('⚠️ Site not fully responsive yet...', 'warning');
          setTimeout(checkSite, this.checkInterval);
        }
      } catch (error) {
        this.log(`❌ Error during site check: ${error.message}`, 'error');
        setTimeout(checkSite, this.checkInterval);
      }
    };

    await checkSite();
  }

  checkUrl(url) {
    return new Promise((resolve) => {
      const request = https.get(url, (response) => {
        const statusOk = response.statusCode >= 200 && response.statusCode < 300;
        this.log(`${statusOk ? '✅' : '❌'} ${url}: ${response.statusCode}`, 
                 statusOk ? 'success' : 'error');
        resolve(statusOk);
      });

      request.on('error', (error) => {
        this.log(`❌ ${url}: ${error.message}`, 'error');
        resolve(false);
      });

      request.setTimeout(5000, () => {
        this.log(`⏰ ${url}: timeout`, 'warning');
        request.destroy();
        resolve(false);
      });
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