#!/usr/bin/env node

/**
 * CONSOLE.LOG REPLACEMENT SCRIPT
 *
 * Automatically replaces console.log/warn/error/info with logger utility
 * Part of Priority 0: Foundation improvements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to skip
const SKIP_FILES = [
  'logger.ts',
  'console-cleanup.ts',
  'debugUtils.ts',
  'monitoring.ts',
  'performance-test.ts'
];

// Get all files with console calls
let files;
try {
  files = execSync(
    `find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) -exec grep -l "console\\." {} \\;`,
    { encoding: 'utf-8' }
  )
    .split('\n')
    .filter(Boolean)
    .filter(file => !SKIP_FILES.some(skip => file.includes(skip)));
} catch (e) {
  files = [];
}

console.log(`Found ${files.length} files with console calls\n`);

let totalReplacements = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  let modified = false;
  let hasLoggerImport = content.includes("from '@/utils/logger'");
  let fileReplacements = 0;

  // Replace console calls
  const newLines = lines.map(line => {
    // Skip if it's already using logger
    if (line.includes('logger.')) {
      return line;
    }

    // Skip if it's in a comment
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return line;
    }

    let newLine = line;

    // console.error -> logger.error
    if (line.includes('console.error')) {
      newLine = newLine.replace(/console\.error\((.*?)\)/, 'logger.error($1)');
      modified = true;
      fileReplacements++;
    }

    // console.warn -> logger.warn
    if (line.includes('console.warn')) {
      newLine = newLine.replace(/console\.warn\((.*?)\)/, 'logger.warn($1)');
      modified = true;
      fileReplacements++;
    }

    // console.info -> logger.info
    if (line.includes('console.info')) {
      newLine = newLine.replace(/console\.info\((.*?)\)/, 'logger.info($1)');
      modified = true;
      fileReplacements++;
    }

    // console.log -> logger.debug (most verbose level)
    if (line.includes('console.log')) {
      newLine = newLine.replace(/console\.log\((.*?)\)/, 'logger.debug($1)');
      modified = true;
      fileReplacements++;
    }

    return newLine;
  });

  if (modified) {
    // Add logger import if not present
    if (!hasLoggerImport) {
      const insertIndex = newLines.findIndex(line =>
        line.includes('import') && !line.includes('import type')
      );

      if (insertIndex !== -1) {
        newLines.splice(insertIndex, 0, "import { logger } from '@/utils/logger'");
      } else {
        // Add at beginning if no imports found
        newLines.unshift("import { logger } from '@/utils/logger'");
      }
    }

    fs.writeFileSync(file, newLines.join('\n'));
    console.log(`✅ ${file}: ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  }
});

console.log(`\n✨ Total: ${totalReplacements} console calls replaced with logger`);
console.log(`📝 Modified: ${files.length} files`);
