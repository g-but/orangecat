#!/usr/bin/env node

/**
 * Deployment Dashboard
 * Real-time monitoring and deployment status for OrangeCat
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class DeploymentDashboard {
  constructor() {
    this.config = {
      productionUrl: process.env.PRODUCTION_URL || 'https://orangecat.vercel.app',
      stagingUrl: process.env.STAGING_URL || 'https://orangecat-staging.vercel.app',
      refreshInterval: 30000, // 30 seconds
      healthCheckTimeout: 5000
    };
    
    this.status = {
      production: { status: 'unknown', lastCheck: null, responseTime: null },
      staging: { status: 'unknown', lastCheck: null, responseTime: null },
      deployment: { inProgress: false, lastDeploy: null },
      metrics: { uptime: 0, errors: 0, deployments: 0 }
    };
    
    this.history = [];
  }

  async checkHealth(url, environment) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          status: 'timeout',
          responseTime: this.config.healthCheckTimeout,
          error: 'Health check timeout'
        });
      }, this.config.healthCheckTimeout);
      
      https.get(`${url}/api/health`, (res) => {
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            resolve({
              status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
              responseTime,
              data: healthData,
              statusCode: res.statusCode
            });
          } catch (error) {
            resolve({
              status: 'error',
              responseTime,
              error: 'Invalid health response'
            });
          }
        });
      }).on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          status: 'error',
          responseTime: Date.now() - startTime,
          error: error.message
        });
      });
    });
  }

  async checkDeploymentStatus() {
    // Check if there's an active deployment by looking for lock files or deployment indicators
    const deploymentIndicators = [
      '.vercel/deployment.json',
      '.next/build-id',
      'deployment-in-progress.lock'
    ];
    
    let deploymentInProgress = false;
    let lastBuildTime = null;
    
    try {
      const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
      if (fs.existsSync(buildIdPath)) {
        const stats = fs.statSync(buildIdPath);
        lastBuildTime = stats.mtime;
      }
    } catch (error) {
      // Build ID not available
    }
    
    return {
      inProgress: deploymentInProgress,
      lastBuild: lastBuildTime
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'healthy': return '🟢';
      case 'unhealthy': return '🟡';
      case 'error': return '🔴';
      case 'timeout': return '⏰';
      default: return '⚪';
    }
  }

  async updateStatus() {
    console.clear();
    
    // Check production health
    const prodHealth = await this.checkHealth(this.config.productionUrl, 'production');
    this.status.production = {
      ...prodHealth,
      lastCheck: new Date().toISOString()
    };
    
    // Check staging health  
    const stagingHealth = await this.checkHealth(this.config.stagingUrl, 'staging');
    this.status.staging = {
      ...stagingHealth,
      lastCheck: new Date().toISOString()
    };
    
    // Check deployment status
    const deploymentStatus = await this.checkDeploymentStatus();
    this.status.deployment = deploymentStatus;
    
    // Update metrics
    if (this.status.production.status === 'healthy') {
      this.status.metrics.uptime += this.config.refreshInterval;
    } else {
      this.status.metrics.errors++;
    }
    
    // Add to history
    this.history.push({
      timestamp: new Date().toISOString(),
      production: this.status.production.status,
      staging: this.status.staging.status,
      responseTime: this.status.production.responseTime
    });
    
    // Keep only last 50 entries
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
  }

  renderDashboard() {
    const now = new Date().toLocaleString();
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // Production Status
    const prodEmoji = this.getStatusEmoji(this.status.production.status);
    const prodStatus = this.status.production.status.toUpperCase().padEnd(10);
    const prodTime = this.status.production.responseTime ? `${this.status.production.responseTime}ms` : 'N/A';
    // REMOVED: console.log statement
    
    // Staging Status
    const stagingEmoji = this.getStatusEmoji(this.status.staging.status);
    const stagingStatus = this.status.staging.status.toUpperCase().padEnd(10);
    const stagingTime = this.status.staging.responseTime ? `${this.status.staging.responseTime}ms` : 'N/A';
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement
    
    // Deployment Status
    const deployStatus = this.status.deployment.inProgress ? '🔄 IN PROGRESS' : '✅ IDLE';
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement
    
    // Metrics
    const uptime = this.formatUptime(this.status.metrics.uptime);
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement
    
    // Recent History (last 10 checks)
    // REMOVED: console.log statement
    const recentHistory = this.history.slice(-10);
    recentHistory.forEach(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const prodIcon = this.getStatusEmoji(entry.production);
      const stagingIcon = this.getStatusEmoji(entry.staging);
      const responseTime = entry.responseTime ? `${entry.responseTime}ms` : 'N/A';
      // REMOVED: console.log statement
    });
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.status,
      history: this.history,
      config: this.config
    };
    
    const reportPath = path.join(process.cwd(), 'deployment-status.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  async start() {
    // REMOVED: console.log statement
    
    // Initial status check
    await this.updateStatus();
    this.renderDashboard();
    
    // Set up periodic updates
    const interval = setInterval(async () => {
      await this.updateStatus();
      this.renderDashboard();
      await this.saveReport();
    }, this.config.refreshInterval);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      // REMOVED: console.log statement
      clearInterval(interval);
      this.saveReport();
      // REMOVED: console.log statement
      process.exit(0);
    });
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
  }

  // Static method for one-time status check
  static async quickCheck() {
    const dashboard = new DeploymentDashboard();
    await dashboard.updateStatus();
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    return dashboard.status;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    DeploymentDashboard.quickCheck();
  } else {
    const dashboard = new DeploymentDashboard();
    dashboard.start();
  }
}

module.exports = DeploymentDashboard; 