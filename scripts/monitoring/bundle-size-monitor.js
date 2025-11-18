#!/usr/bin/env node

/**
 * Bundle Size Monitor for CI/CD
 * 
 * Monitors JavaScript bundle sizes and reports changes.
 * Helps prevent bundle bloat and tracks performance regression.
 * 
 * Created: 2025-06-30
 * Usage: npm run build:analyze && node scripts/monitoring/bundle-size-monitor.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Bundle size thresholds (in KB)
  thresholds: {
    main: 500,      // Main bundle max size
    vendor: 1000,   // Vendor bundle max size
    total: 1500,    // Total bundle max size
    chunk: 200      // Individual chunk max size
  },
  
  // Warning thresholds (in KB)
  warningThresholds: {
    main: 400,
    vendor: 800,
    total: 1200,
    chunk: 150
  },
  
  // Paths
  buildDir: '.next',
  reportPath: './test-results/bundle-size-report.json',
  historyPath: './test-results/bundle-size-history.json',
  
  // GitHub integration
  enableGitHubComments: process.env.CI === 'true',
  maxHistoryEntries: 50
};

/**
 * Get bundle information from Next.js build output
 * @returns {Object} Bundle analysis data
 */
function analyzeBundles() {
  const buildManifestPath = path.join(CONFIG.buildDir, 'build-manifest.json');
  const staticDir = path.join(CONFIG.buildDir, 'static');
  
  if (!fs.existsSync(buildManifestPath)) {
    throw new Error('Build manifest not found. Run `npm run build` first.');
  }
  
  const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
  const bundles = {};
  let totalSize = 0;
  
  // Get all JavaScript files from static directory
  function getJSFiles(dir, prefix = '') {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getJSFiles(fullPath, `${prefix}${item}/`));
      } else if (item.endsWith('.js')) {
        const size = stat.size;
        files.push({
          name: `${prefix}${item}`,
          path: fullPath,
          size: size,
          sizeKB: Math.round(size / 1024 * 100) / 100
        });
        totalSize += size;
      }
    }
    return files;
  }
  
  const jsFiles = getJSFiles(staticDir);
  
  // Categorize bundles
  const mainBundles = jsFiles.filter(f => f.name.includes('main-') || f.name.includes('app-'));
  const vendorBundles = jsFiles.filter(f => f.name.includes('vendor-') || f.name.includes('webpack-'));
  const chunkBundles = jsFiles.filter(f => !f.name.includes('main-') && !f.name.includes('app-') && !f.name.includes('vendor-') && !f.name.includes('webpack-'));
  
  return {
    timestamp: new Date().toISOString(),
    git: getGitInfo(),
    bundles: {
      main: {
        files: mainBundles,
        totalSize: mainBundles.reduce((sum, f) => sum + f.size, 0),
        totalSizeKB: Math.round(mainBundles.reduce((sum, f) => sum + f.size, 0) / 1024 * 100) / 100
      },
      vendor: {
        files: vendorBundles,
        totalSize: vendorBundles.reduce((sum, f) => sum + f.size, 0),
        totalSizeKB: Math.round(vendorBundles.reduce((sum, f) => sum + f.size, 0) / 1024 * 100) / 100
      },
      chunks: {
        files: chunkBundles,
        totalSize: chunkBundles.reduce((sum, f) => sum + f.size, 0),
        totalSizeKB: Math.round(chunkBundles.reduce((sum, f) => sum + f.size, 0) / 1024 * 100) / 100
      },
      all: {
        files: jsFiles,
        totalSize: totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
      }
    }
  };
}

/**
 * Get Git information for tracking changes
 * @returns {Object} Git info
 */
function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const author = execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim();
    
    return { commit, branch, author, message };
  } catch (error) {
    return { commit: 'unknown', branch: 'unknown', author: 'unknown', message: 'unknown' };
  }
}

/**
 * Load bundle size history
 * @returns {Array} Historical data
 */
function loadHistory() {
  if (!fs.existsSync(CONFIG.historyPath)) {
    return [];
  }
  
  try {
    return JSON.parse(fs.readFileSync(CONFIG.historyPath, 'utf8'));
  } catch (error) {
    console.warn('⚠️  Could not load bundle size history:', error.message);
    return [];
  }
}

/**
 * Save bundle size history
 * @param {Array} history - Historical data to save
 */
function saveHistory(history) {
  const dir = path.dirname(CONFIG.historyPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.historyPath, JSON.stringify(history, null, 2));
}

/**
 * Compare current bundles with thresholds and history
 * @param {Object} current - Current bundle analysis
 * @param {Array} history - Historical data
 * @returns {Object} Comparison results
 */
function compareWithThresholds(current, history) {
  const results = {
    status: 'pass',
    warnings: [],
    errors: [],
    improvements: [],
    regressions: []
  };
  
  const { bundles } = current;
  
  // Check against absolute thresholds
  if (bundles.main.totalSizeKB > CONFIG.thresholds.main) {
    results.errors.push(`Main bundle exceeds threshold: ${bundles.main.totalSizeKB}KB > ${CONFIG.thresholds.main}KB`);
    results.status = 'fail';
  } else if (bundles.main.totalSizeKB > CONFIG.warningThresholds.main) {
    results.warnings.push(`Main bundle approaching threshold: ${bundles.main.totalSizeKB}KB (limit: ${CONFIG.thresholds.main}KB)`);
    if (results.status === 'pass') results.status = 'warn';
  }
  
  if (bundles.vendor.totalSizeKB > CONFIG.thresholds.vendor) {
    results.errors.push(`Vendor bundle exceeds threshold: ${bundles.vendor.totalSizeKB}KB > ${CONFIG.thresholds.vendor}KB`);
    results.status = 'fail';
  } else if (bundles.vendor.totalSizeKB > CONFIG.warningThresholds.vendor) {
    results.warnings.push(`Vendor bundle approaching threshold: ${bundles.vendor.totalSizeKB}KB (limit: ${CONFIG.thresholds.vendor}KB)`);
    if (results.status === 'pass') results.status = 'warn';
  }
  
  if (bundles.all.totalSizeKB > CONFIG.thresholds.total) {
    results.errors.push(`Total bundle size exceeds threshold: ${bundles.all.totalSizeKB}KB > ${CONFIG.thresholds.total}KB`);
    results.status = 'fail';
  } else if (bundles.all.totalSizeKB > CONFIG.warningThresholds.total) {
    results.warnings.push(`Total bundle size approaching threshold: ${bundles.all.totalSizeKB}KB (limit: ${CONFIG.thresholds.total}KB)`);
    if (results.status === 'pass') results.status = 'warn';
  }
  
  // Check individual chunks
  bundles.chunks.files.forEach(chunk => {
    if (chunk.sizeKB > CONFIG.thresholds.chunk) {
      results.errors.push(`Chunk ${chunk.name} exceeds threshold: ${chunk.sizeKB}KB > ${CONFIG.thresholds.chunk}KB`);
      results.status = 'fail';
    } else if (chunk.sizeKB > CONFIG.warningThresholds.chunk) {
      results.warnings.push(`Chunk ${chunk.name} approaching threshold: ${chunk.sizeKB}KB (limit: ${CONFIG.thresholds.chunk}KB)`);
      if (results.status === 'pass') results.status = 'warn';
    }
  });
  
  // Compare with previous build (if available)
  if (history.length > 0) {
    const previous = history[history.length - 1];
    const prevTotal = previous.bundles.all.totalSizeKB;
    const currentTotal = bundles.all.totalSizeKB;
    const diff = currentTotal - prevTotal;
    const diffPercent = Math.round((diff / prevTotal) * 100 * 100) / 100;
    
    if (diff > 0) {
      if (diff > 50) { // 50KB increase is significant
        results.regressions.push(`Bundle size increased significantly: +${diff}KB (+${diffPercent}%)`);
        if (results.status === 'pass') results.status = 'warn';
      } else {
        results.regressions.push(`Bundle size increased: +${diff}KB (+${diffPercent}%)`);
      }
    } else if (diff < 0) {
      results.improvements.push(`Bundle size decreased: ${diff}KB (${diffPercent}%)`);
    }
    
    // Check main bundle regression
    const prevMain = previous.bundles.main.totalSizeKB;
    const currentMain = bundles.main.totalSizeKB;
    const mainDiff = currentMain - prevMain;
    
    if (mainDiff > 25) { // 25KB increase in main bundle
      results.regressions.push(`Main bundle increased significantly: +${mainDiff}KB`);
      if (results.status === 'pass') results.status = 'warn';
    }
  }
  
  return results;
}

/**
 * Generate detailed report
 * @param {Object} analysis - Bundle analysis
 * @param {Object} comparison - Comparison results
 * @param {Array} history - Historical data
 * @returns {Object} Complete report
 */
function generateReport(analysis, comparison, history) {
  return {
    timestamp: analysis.timestamp,
    git: analysis.git,
    status: comparison.status,
    summary: {
      totalSize: analysis.bundles.all.totalSizeKB,
      mainBundle: analysis.bundles.main.totalSizeKB,
      vendorBundle: analysis.bundles.vendor.totalSizeKB,
      chunks: analysis.bundles.chunks.files.length,
      largestChunk: Math.max(...analysis.bundles.chunks.files.map(f => f.sizeKB), 0)
    },
    thresholds: CONFIG.thresholds,
    comparison: comparison,
    bundles: analysis.bundles,
    history: {
      entries: history.length,
      trend: calculateTrend(history)
    }
  };
}

/**
 * Calculate size trend from history
 * @param {Array} history - Historical data
 * @returns {Object} Trend analysis
 */
function calculateTrend(history) {
  if (history.length < 2) {
    return { direction: 'unknown', change: 0 };
  }
  
  const recent = history.slice(-5); // Last 5 builds
  const first = recent[0].bundles.all.totalSizeKB;
  const last = recent[recent.length - 1].bundles.all.totalSizeKB;
  const change = last - first;
  
  return {
    direction: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
    change: Math.round(change * 100) / 100,
    period: recent.length
  };
}

/**
 * Format report for console output
 * @param {Object} report - Generated report
 */
function printReport(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📦 BUNDLE SIZE ANALYSIS REPORT');
  console.log('='.repeat(60));
  
  // Status indicator
  const statusIcon = {
    pass: '✅',
    warn: '⚠️ ',
    fail: '❌'
  }[report.status];
  
  console.log(`${statusIcon} Status: ${report.status.toUpperCase()}`);
  console.log(`🕐 Timestamp: ${report.timestamp}`);
  console.log(`🌿 Branch: ${report.git.branch}`);
  console.log(`📝 Commit: ${report.git.commit.substring(0, 8)}`);
  console.log();
  
  // Bundle sizes
  console.log('📊 BUNDLE SIZES:');
  console.log(`   📦 Total: ${report.summary.totalSize}KB`);
  console.log(`   🎯 Main: ${report.summary.mainBundle}KB`);
  console.log(`   📚 Vendor: ${report.summary.vendorBundle}KB`);
  console.log(`   🧩 Chunks: ${report.summary.chunks} files (largest: ${report.summary.largestChunk}KB)`);
  console.log();
  
  // Thresholds
  console.log('🎯 THRESHOLDS:');
  console.log(`   Total: ${report.summary.totalSize}KB / ${report.thresholds.total}KB`);
  console.log(`   Main: ${report.summary.mainBundle}KB / ${report.thresholds.main}KB`);
  console.log(`   Vendor: ${report.summary.vendorBundle}KB / ${report.thresholds.vendor}KB`);
  console.log();
  
  // Issues
  if (report.comparison.errors.length > 0) {
    console.log('❌ ERRORS:');
    report.comparison.errors.forEach(error => console.log(`   • ${error}`));
    console.log();
  }
  
  if (report.comparison.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    report.comparison.warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log();
  }
  
  if (report.comparison.regressions.length > 0) {
    console.log('📈 SIZE INCREASES:');
    report.comparison.regressions.forEach(regression => console.log(`   • ${regression}`));
    console.log();
  }
  
  if (report.comparison.improvements.length > 0) {
    console.log('📉 IMPROVEMENTS:');
    report.comparison.improvements.forEach(improvement => console.log(`   • ${improvement}`));
    console.log();
  }
  
  // Trend
  if (report.history.entries > 1) {
    const trend = report.history.trend;
    const trendIcon = {
      increasing: '📈',
      decreasing: '📉',
      stable: '➡️ ',
      unknown: '❓'
    }[trend.direction];
    
    console.log('📊 TREND ANALYSIS:');
    console.log(`   ${trendIcon} Direction: ${trend.direction}`);
    console.log(`   📏 Change: ${trend.change}KB over ${trend.period} builds`);
    console.log();
  }
  
  // Top chunks
  if (report.bundles.chunks.files.length > 0) {
    console.log('🏆 LARGEST CHUNKS:');
    const sortedChunks = [...report.bundles.chunks.files]
      .sort((a, b) => b.sizeKB - a.sizeKB)
      .slice(0, 5);
    
    sortedChunks.forEach((chunk, index) => {
      console.log(`   ${index + 1}. ${chunk.name}: ${chunk.sizeKB}KB`);
    });
    console.log();
  }
  
  // Recommendations
  if (report.status !== 'pass') {
    console.log('💡 RECOMMENDATIONS:');
    
    if (report.summary.vendorBundle > CONFIG.warningThresholds.vendor) {
      console.log('   • Consider code splitting for vendor dependencies');
      console.log('   • Review if all vendor dependencies are necessary');
    }
    
    if (report.summary.mainBundle > CONFIG.warningThresholds.main) {
      console.log('   • Implement lazy loading for non-critical components');
      console.log('   • Consider moving large utilities to separate chunks');
    }
    
    if (report.summary.largestChunk > CONFIG.warningThresholds.chunk) {
      console.log('   • Split large chunks into smaller modules');
      console.log('   • Review dynamic imports strategy');
    }
    
    console.log('   • Run `npm run build:analyze` to analyze bundle composition');
    console.log('   • Consider using tree shaking to eliminate unused code');
    console.log();
  }
  
  console.log('='.repeat(60));
}

/**
 * Generate GitHub comment for PR
 * @param {Object} report - Generated report
 * @returns {string} Markdown comment
 */
function generateGitHubComment(report) {
  const statusIcon = {
    pass: '✅',
    warn: '⚠️',
    fail: '❌'
  }[report.status];
  
  let comment = `## ${statusIcon} Bundle Size Report\n\n`;
  
  // Summary table
  comment += `| Bundle | Size | Threshold | Status |\n`;
  comment += `|--------|------|-----------|--------|\n`;
  comment += `| **Total** | ${report.summary.totalSize}KB | ${report.thresholds.total}KB | ${report.summary.totalSize <= report.thresholds.total ? '✅' : '❌'} |\n`;
  comment += `| **Main** | ${report.summary.mainBundle}KB | ${report.thresholds.main}KB | ${report.summary.mainBundle <= report.thresholds.main ? '✅' : '❌'} |\n`;
  comment += `| **Vendor** | ${report.summary.vendorBundle}KB | ${report.thresholds.vendor}KB | ${report.summary.vendorBundle <= report.thresholds.vendor ? '✅' : '❌'} |\n`;
  comment += `| **Chunks** | ${report.summary.chunks} files | - | ${report.summary.largestChunk <= report.thresholds.chunk ? '✅' : '❌'} |\n\n`;
  
  // Issues
  if (report.comparison.errors.length > 0) {
    comment += `### ❌ Errors\n`;
    report.comparison.errors.forEach(error => {
      comment += `- ${error}\n`;
    });
    comment += '\n';
  }
  
  if (report.comparison.warnings.length > 0) {
    comment += `### ⚠️ Warnings\n`;
    report.comparison.warnings.forEach(warning => {
      comment += `- ${warning}\n`;
    });
    comment += '\n';
  }
  
  if (report.comparison.regressions.length > 0) {
    comment += `### 📈 Size Changes\n`;
    report.comparison.regressions.forEach(regression => {
      comment += `- ${regression}\n`;
    });
    comment += '\n';
  }
  
  if (report.comparison.improvements.length > 0) {
    comment += `### 📉 Improvements\n`;
    report.comparison.improvements.forEach(improvement => {
      comment += `- ${improvement}\n`;
    });
    comment += '\n';
  }
  
  // Trend
  if (report.history.entries > 1) {
    const trend = report.history.trend;
    const trendIcon = {
      increasing: '📈',
      decreasing: '📉',
      stable: '➡️',
      unknown: '❓'
    }[trend.direction];
    
    comment += `### 📊 Trend Analysis\n`;
    comment += `${trendIcon} **${trend.direction}** (${trend.change}KB over ${trend.period} builds)\n\n`;
  }
  
  comment += `<details><summary>📦 Detailed Bundle Analysis</summary>\n\n`;
  comment += `**Commit:** \`${report.git.commit.substring(0, 8)}\`\n`;
  comment += `**Branch:** \`${report.git.branch}\`\n`;
  comment += `**Timestamp:** ${report.timestamp}\n\n`;
  comment += `</details>`;
  
  return comment;
}

/**
 * Main execution function
 */
async function main() {
  console.log('📦 Bundle Size Monitor');
  console.log('======================\n');
  
  try {
    // Analyze current bundles
    console.log('🔍 Analyzing bundle sizes...');
    const analysis = analyzeBundles();
    
    // Load history
    console.log('📚 Loading bundle size history...');
    const history = loadHistory();
    
    // Compare with thresholds and history
    console.log('⚖️  Comparing with thresholds...');
    const comparison = compareWithThresholds(analysis, history);
    
    // Generate report
    const report = generateReport(analysis, comparison, history);
    
    // Save report
    const reportDir = path.dirname(CONFIG.reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.reportPath, JSON.stringify(report, null, 2));
    
    // Update history
    history.push(analysis);
    if (history.length > CONFIG.maxHistoryEntries) {
      history.splice(0, history.length - CONFIG.maxHistoryEntries);
    }
    saveHistory(history);
    
    // Print report
    printReport(report);
    
    // Generate GitHub comment if in CI
    if (CONFIG.enableGitHubComments && process.env.GITHUB_ACTIONS) {
      const comment = generateGitHubComment(report);
      const commentPath = './test-results/bundle-size-comment.md';
      fs.writeFileSync(commentPath, comment);
      console.log(`💬 GitHub comment saved to: ${commentPath}`);
    }
    
    console.log(`📊 Report saved to: ${CONFIG.reportPath}`);
    console.log(`📈 History updated: ${CONFIG.historyPath}`);
    
    // Exit with appropriate code
    process.exit(report.status === 'fail' ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Bundle size analysis failed:', error.message);
    console.error('💡 Make sure to run `npm run build` before running this script.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main, analyzeBundles, generateReport };