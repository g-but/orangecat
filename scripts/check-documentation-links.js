#!/usr/bin/env node

/**
 * Automated Documentation Link Checker
 * 
 * Scans all documentation files for broken links and references.
 * Validates both internal links and external URLs.
 * 
 * Created: 2025-06-30
 * Usage: npm run docs:check-links
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const DOCS_DIRS = [
  './docs',
  './README.md',
  './CHANGELOG.md',
  './src/components/README.md',
  './src/services/README.md',
  './src/hooks/README.md',
  './src/utils/README.md',
  './src/types/README.md'
];

const IGNORE_PATTERNS = [
  /localhost/,
  /127\.0\.0\.1/,
  /example\.com/,
  /placeholder\./,
  /\[.*\]\(#.*\)/, // Internal anchors
  /mailto:/,
  /tel:/,
  /javascript:/,
  /data:/
];

const RESULTS = {
  totalFiles: 0,
  totalLinks: 0,
  brokenLinks: [],
  warnings: [],
  validLinks: []
};

/**
 * Extract links from markdown content
 * @param {string} content - Markdown file content
 * @returns {Array} Array of link objects with url, text, and line number
 */
function extractLinks(content) {
  const links = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match markdown links [text](url)
    const markdownLinks = line.match(/\[([^\]]*)\]\(([^)]+)\)/g);
    if (markdownLinks) {
      markdownLinks.forEach(match => {
        const [, text, url] = match.match(/\[([^\]]*)\]\(([^)]+)\)/);
        links.push({
          text: text.trim(),
          url: url.trim(),
          line: index + 1,
          type: 'markdown'
        });
      });
    }
    
    // Match HTML links <a href="url">
    const htmlLinks = line.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/g);
    if (htmlLinks) {
      htmlLinks.forEach(match => {
        const [, url] = match.match(/href=["']([^"']+)["']/);
        const textMatch = match.match(/>([^<]*)</);
        const text = textMatch ? textMatch[1] : url;
        links.push({
          text: text.trim(),
          url: url.trim(),
          line: index + 1,
          type: 'html'
        });
      });
    }
    
    // Match reference-style links [text]: url
    const refLinks = line.match(/^\s*\[([^\]]+)\]:\s*(.+)$/);
    if (refLinks) {
      const [, text, url] = refLinks;
      links.push({
        text: text.trim(),
        url: url.trim(),
        line: index + 1,
        type: 'reference'
      });
    }
  });
  
  return links;
}

/**
 * Check if internal file path exists
 * @param {string} filePath - File path to check
 * @param {string} basePath - Base directory path
 * @returns {boolean} True if file exists
 */
function checkInternalLink(filePath, basePath) {
  try {
    // Handle relative paths
    let fullPath = path.resolve(basePath, filePath);
    
    // Handle anchor links
    const [pathPart] = filePath.split('#');
    if (pathPart) {
      fullPath = path.resolve(basePath, pathPart);
    }
    
    // Check if file exists
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
}

/**
 * Check if external URL is accessible
 * @param {string} url - URL to check
 * @returns {Promise<Object>} Result object with status and error
 */
function checkExternalLink(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    // Parse URL to handle special cases
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      resolve({ valid: false, error: 'Invalid URL format' });
      return;
    }
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'OrangeCat-Documentation-Link-Checker/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 400) {
        resolve({ valid: true, statusCode });
      } else if (statusCode >= 300 && statusCode < 400) {
        // Redirect - consider valid but note it
        resolve({ valid: true, statusCode, warning: 'Redirect' });
      } else {
        resolve({ valid: false, error: `HTTP ${statusCode}` });
      }
    });
    
    req.on('error', (error) => {
      resolve({ valid: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: false, error: 'Request timeout' });
    });
    
    req.setTimeout(10000);
    req.end();
  });
}

/**
 * Process a single documentation file
 * @param {string} filePath - Path to the file
 */
async function processFile(filePath) {
  try {
    console.log(`📄 Checking: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const links = extractLinks(content);
    const basePath = path.dirname(filePath);
    
    RESULTS.totalFiles++;
    RESULTS.totalLinks += links.length;
    
    for (const link of links) {
      // Skip ignored patterns
      if (IGNORE_PATTERNS.some(pattern => pattern.test(link.url))) {
        console.log(`  ⏭️  Skipped: ${link.url} (ignored pattern)`);
        continue;
      }
      
      if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
        // External link
        console.log(`  🌐 Checking external: ${link.url}`);
        const result = await checkExternalLink(link.url);
        
        if (result.valid) {
          RESULTS.validLinks.push({
            file: filePath,
            line: link.line,
            url: link.url,
            text: link.text,
            type: 'external'
          });
          
          if (result.warning) {
            RESULTS.warnings.push({
              file: filePath,
              line: link.line,
              url: link.url,
              text: link.text,
              warning: result.warning,
              statusCode: result.statusCode
            });
            console.log(`  ⚠️  Warning: ${link.url} (${result.warning})`);
          } else {
            console.log(`  ✅ Valid: ${link.url}`);
          }
        } else {
          RESULTS.brokenLinks.push({
            file: filePath,
            line: link.line,
            url: link.url,
            text: link.text,
            error: result.error,
            type: 'external'
          });
          console.log(`  ❌ Broken: ${link.url} (${result.error})`);
        }
      } else {
        // Internal link
        console.log(`  📂 Checking internal: ${link.url}`);
        const exists = checkInternalLink(link.url, basePath);
        
        if (exists) {
          RESULTS.validLinks.push({
            file: filePath,
            line: link.line,
            url: link.url,
            text: link.text,
            type: 'internal'
          });
          console.log(`  ✅ Valid: ${link.url}`);
        } else {
          RESULTS.brokenLinks.push({
            file: filePath,
            line: link.line,
            url: link.url,
            text: link.text,
            error: 'File not found',
            type: 'internal'
          });
          console.log(`  ❌ Broken: ${link.url} (File not found)`);
        }
      }
    }
    
    console.log(`  📊 Found ${links.length} links in ${filePath}\n`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Find all markdown files in a directory
 * @param {string} dir - Directory to search
 * @returns {Array} Array of file paths
 */
function findMarkdownFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!item.startsWith('.') && item !== 'node_modules') {
        files.push(...findMarkdownFiles(fullPath));
      }
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Generate summary report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 DOCUMENTATION LINK CHECK SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`📄 Files processed: ${RESULTS.totalFiles}`);
  console.log(`🔗 Total links checked: ${RESULTS.totalLinks}`);
  console.log(`✅ Valid links: ${RESULTS.validLinks.length}`);
  console.log(`⚠️  Warnings: ${RESULTS.warnings.length}`);
  console.log(`❌ Broken links: ${RESULTS.brokenLinks.length}`);
  
  if (RESULTS.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    RESULTS.warnings.forEach(warning => {
      console.log(`  📄 ${warning.file}:${warning.line}`);
      console.log(`     🔗 ${warning.url}`);
      console.log(`     ⚠️  ${warning.warning} (HTTP ${warning.statusCode})`);
      console.log();
    });
  }
  
  if (RESULTS.brokenLinks.length > 0) {
    console.log('\n❌ BROKEN LINKS:');
    RESULTS.brokenLinks.forEach(broken => {
      console.log(`  📄 ${broken.file}:${broken.line}`);
      console.log(`     🔗 ${broken.url}`);
      console.log(`     ❌ ${broken.error}`);
      console.log(`     📝 Text: "${broken.text}"`);
      console.log();
    });
    
    console.log('🔧 SUGGESTED FIXES:');
    const internalBroken = RESULTS.brokenLinks.filter(link => link.type === 'internal');
    const externalBroken = RESULTS.brokenLinks.filter(link => link.type === 'external');
    
    if (internalBroken.length > 0) {
      console.log('  📂 Internal links:');
      console.log('     - Check file paths are correct');
      console.log('     - Verify files haven\'t been moved or renamed');
      console.log('     - Update relative path references');
    }
    
    if (externalBroken.length > 0) {
      console.log('  🌐 External links:');
      console.log('     - Verify URLs are still active');
      console.log('     - Check for domain changes or redirects');
      console.log('     - Consider using archived versions for historical links');
    }
  } else {
    console.log('\n🎉 All links are valid! Documentation is well-maintained.');
  }
  
  // Save detailed report to file
  const reportPath = './test-results/link-check-report.json';
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const detailedReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: RESULTS.totalFiles,
      totalLinks: RESULTS.totalLinks,
      validLinks: RESULTS.validLinks.length,
      warnings: RESULTS.warnings.length,
      brokenLinks: RESULTS.brokenLinks.length
    },
    results: {
      validLinks: RESULTS.validLinks,
      warnings: RESULTS.warnings,
      brokenLinks: RESULTS.brokenLinks
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
  console.log(`\n📊 Detailed report saved to: ${reportPath}`);
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(RESULTS.brokenLinks.length > 0 ? 1 : 0);
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔍 OrangeCat Documentation Link Checker');
  console.log('=====================================\n');
  
  const filesToCheck = [];
  
  // Collect all files to check
  for (const docPath of DOCS_DIRS) {
    if (fs.existsSync(docPath)) {
      const stat = fs.statSync(docPath);
      if (stat.isDirectory()) {
        filesToCheck.push(...findMarkdownFiles(docPath));
      } else if (docPath.endsWith('.md') || docPath.endsWith('.mdx')) {
        filesToCheck.push(docPath);
      }
    } else {
      console.log(`⚠️  Path not found: ${docPath}`);
    }
  }
  
  console.log(`📋 Found ${filesToCheck.length} documentation files to check\n`);
  
  if (filesToCheck.length === 0) {
    console.log('❌ No documentation files found to check');
    process.exit(1);
  }
  
  // Process all files
  for (const file of filesToCheck) {
    await processFile(file);
  }
  
  // Generate final report
  generateReport();
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the checker
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main, checkExternalLink, checkInternalLink, extractLinks };