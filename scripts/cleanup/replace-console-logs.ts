#!/usr/bin/env ts-node
/**
 * Replace console.log/error/warn/debug with logger
 * 
 * Usage: npx ts-node scripts/cleanup/replace-console-logs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const loggerImport = "import { logger } from '@/utils/logger';";

async function replaceConsoleLogs() {
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  });

  let totalReplaced = 0;
  const filesModified: string[] = [];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    let hasLoggerImport = content.includes("from '@/utils/logger'") || content.includes('from "@/utils/logger"');

    // Replace console.log
    const logMatches = content.match(/console\.log\(/g);
    if (logMatches) {
      content = content.replace(/console\.log\(/g, 'logger.info(');
      modified = true;
      totalReplaced += logMatches.length;
    }

    // Replace console.error
    const errorMatches = content.match(/console\.error\(/g);
    if (errorMatches) {
      content = content.replace(/console\.error\(/g, 'logger.error(');
      modified = true;
      totalReplaced += errorMatches.length;
    }

    // Replace console.warn
    const warnMatches = content.match(/console\.warn\(/g);
    if (warnMatches) {
      content = content.replace(/console\.warn\(/g, 'logger.warn(');
      modified = true;
      totalReplaced += warnMatches.length;
    }

    // Replace console.debug
    const debugMatches = content.match(/console\.debug\(/g);
    if (debugMatches) {
      content = content.replace(/console\.debug\(/g, 'logger.debug(');
      modified = true;
      totalReplaced += debugMatches.length;
    }

    // Add logger import if needed
    if (modified && !hasLoggerImport) {
      // Find the last import statement
      const importRegex = /^import\s+.*$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        content = content.slice(0, insertIndex) + '\n' + loggerImport + content.slice(insertIndex);
      } else {
        // No imports, add at the top
        content = loggerImport + '\n' + content;
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      filesModified.push(file);
      console.log(`✅ ${file} - Replaced ${(logMatches?.length || 0) + (errorMatches?.length || 0) + (warnMatches?.length || 0) + (debugMatches?.length || 0)} console statements`);
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Files modified: ${filesModified.length}`);
  console.log(`   Total replacements: ${totalReplaced}`);
}

replaceConsoleLogs().catch(console.error);


