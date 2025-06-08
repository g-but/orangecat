#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes Next.js bundle size and provides optimization recommendations
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_SIZE_LIMITS = {
  'First Load JS shared by all': 250 * 1024, // 250KB
  'chunks/main-*': 400 * 1024, // 400KB
  'chunks/pages/': 200 * 1024, // 200KB per page
};

const PERFORMANCE_BUDGETS = {
  totalJavaScript: 500 * 1024, // 500KB total JS
  totalCSS: 100 * 1024, // 100KB total CSS
  images: 1024 * 1024, // 1MB total images
};

function analyzeBundle() {
  console.log('🔍 Analyzing bundle...');
  
  const buildManifest = path.join(process.cwd(), '.next', 'build-manifest.json');
  const nextManifest = path.join(process.cwd(), '.next', 'prerender-manifest.json');
  
  try {
    // Check if build exists
    if (!fs.existsSync(buildManifest)) {
      console.log('⚠️  No build found. Run npm run build first.');
      return;
    }
    
    // Read build manifest
    const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
    
    console.log('📊 Bundle Analysis Results:');
    console.log('================================');
    
    // Analyze main chunks
    let totalJS = 0;
    let violations = [];
    
    Object.entries(manifest.pages).forEach(([page, files]) => {
      const jsFiles = files.filter(file => file.endsWith('.js'));
      const jsSize = jsFiles.reduce((acc, file) => {
        const filePath = path.join(process.cwd(), '.next', 'static', file);
        if (fs.existsSync(filePath)) {
          return acc + fs.statSync(filePath).size;
        }
        return acc;
      }, 0);
      
      totalJS += jsSize;
      
      console.log(`📄 ${page}: ${formatBytes(jsSize)}`);
      
      if (jsSize > BUNDLE_SIZE_LIMITS['chunks/pages/']) {
        violations.push(`${page} exceeds size limit: ${formatBytes(jsSize)}`);
      }
    });
    
    // Check performance budgets
    console.log('\n💡 Performance Budget Check:');
    console.log('==============================');
    
    console.log(`Total JavaScript: ${formatBytes(totalJS)} / ${formatBytes(PERFORMANCE_BUDGETS.totalJavaScript)}`);
    if (totalJS > PERFORMANCE_BUDGETS.totalJavaScript) {
      violations.push(`Total JavaScript exceeds budget: ${formatBytes(totalJS)}`);
    }
    
    // Recommendations
    if (violations.length > 0) {
      console.log('\n⚠️  Bundle Size Violations:');
      violations.forEach(violation => console.log(`  • ${violation}`));
      
      console.log('\n💡 Optimization Recommendations:');
      console.log('  • Enable tree shaking');
      console.log('  • Use dynamic imports for heavy components');
      console.log('  • Optimize images with next/image');
      console.log('  • Consider code splitting strategies');
    } else {
      console.log('\n✅ All performance budgets met!');
    }
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      totalJavaScript: totalJS,
      violations,
      recommendations: generateRecommendations(totalJS, violations)
    };
    
    const reportPath = path.join(process.cwd(), '.next', 'bundle-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📝 Report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateRecommendations(totalJS, violations) {
  const recommendations = [];
  
  if (totalJS > PERFORMANCE_BUDGETS.totalJavaScript) {
    recommendations.push('Consider implementing lazy loading for non-critical components');
    recommendations.push('Review and optimize third-party dependencies');
    recommendations.push('Use Next.js bundle analyzer to identify large modules');
  }
  
  if (violations.length > 3) {
    recommendations.push('Implement aggressive code splitting');
    recommendations.push('Consider using Server Components for static content');
  }
  
  return recommendations;
}

// Run analysis
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle }; 