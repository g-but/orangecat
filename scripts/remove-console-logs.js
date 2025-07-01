#!/usr/bin/env node

/**
 * SECURITY FIX: Remove Console.log Statements
 * 
 // REMOVED: console.log statement
 * sensitive data in production, replacing them with proper logging.
 * 
 * Created: 2025-01-17
 * Last Modified: 2025-01-17
 * Last Modified Summary: Initial creation to fix security vulnerabilities
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// File patterns to process
const patterns = [
  'src/**/*.{ts,tsx,js,jsx}',
  'scripts/**/*.{ts,js}',
  'tests/**/*.{ts,tsx,js,jsx}'
];

// Files to skip (test files, development utilities)
const skipFiles = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  '__tests__',
  '.test.',
  'test-results',
  'console-cleanup.ts', // Our cleanup utility
  'debugUtils.ts', // Debug utilities
  'dev-seed.ts' // Development seeding
];

// Console.log patterns to remove
const dangerousPatterns = [
  /console\.log\s*\([^)]*auth[^)]*\)/gi,
  /console\.log\s*\([^)]*password[^)]*\)/gi,
  /console\.log\s*\([^)]*token[^)]*\)/gi,
  /console\.log\s*\([^)]*session[^)]*\)/gi,
  /console\.log\s*\([^)]*user[^)]*\)/gi,
  /console\.log\s*\([^)]*login[^)]*\)/gi,
  /console\.log\s*\([^)]*signin[^)]*\)/gi,
  /console\.log\s*\([^)]*email[^)]*\)/gi,
  /console\.log\s*\([^)]*sensitive[^)]*\)/gi,
  /console\.log\s*\([^)]*credential[^)]*\)/gi
];

// REMOVED: console.log statement
const safePatterns = [
  /console\.log\s*\(\s*['"`]✅[^)]*\)/gi,
  /console\.log\s*\(\s*['"`]🎯[^)]*\)/gi,
  /console\.log\s*\(\s*['"`]📊[^)]*\)/gi,
  /console\.log\s*\(\s*['"`]\[DEV\][^)]*\)/gi
];

function shouldSkipFile(filePath) {
  return skipFiles.some(skip => filePath.includes(skip));
}

function isDangerousConsoleLog(line) {
  return dangerousPatterns.some(pattern => pattern.test(line));
}

function isSafeConsoleLog(line) {
  return safePatterns.some(pattern => pattern.test(line));
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    return { removed: 0, kept: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let removed = 0;
  let kept = 0;

  const processedLines = lines.map(line => {
    // REMOVED: console.log statement
      if (isDangerousConsoleLog(line)) {
        // Replace with proper logging
        const indent = line.match(/^\s*/)[0];
        removed++;
        // REMOVED: console.log statement
      } else if (isSafeConsoleLog(line)) {
        // Keep safe development logs but wrap in dev check
        const indent = line.match(/^\s*/)[0];
        kept++;
        return `${indent}if (process.env.NODE_ENV === 'development') ${line.trim()}`;
      } else {
        // REMOVED: console.log statement
        const indent = line.match(/^\s*/)[0];
        removed++;
        // REMOVED: console.log statement
      }
    }
    return line;
  });

  if (removed > 0) {
    fs.writeFileSync(filePath, processedLines.join('\n'));
    if (process.env.NODE_ENV === 'development') console.log(`✅ ${filePath}: Removed ${removed} dangerous console.log statements, kept ${kept} safe ones`);
  }

  return { removed, kept };
}

function main() {
  // REMOVED: console.log statement
  
  let totalRemoved = 0;
  let totalKept = 0;
  let filesProcessed = 0;

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['node_modules/**', '.next/**'] });
    
    files.forEach(file => {
      const result = processFile(file);
      totalRemoved += result.removed;
      totalKept += result.kept;
      if (result.removed > 0 || result.kept > 0) {
        filesProcessed++;
      }
    });
  });

  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  if (totalRemoved > 0) {
    // REMOVED: console.log statement
    // REMOVED: console.log statement
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, main }; 