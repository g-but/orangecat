#!/usr/bin/env ts-node
/**
 * CONSOLE.LOG CLEANUP SCRIPT
 * 
 * Created: 2025-01-09
 * Purpose: Remove 193 console.log statements from codebase for production security
 * 
 * Security Risk: console.log statements can expose sensitive data in production
 * Compliance: Ensures production code follows security best practices
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface CleanupResult {
  totalFiles: number
  modifiedFiles: number
  removedStatements: number
  skippedFiles: string[]
}

class ConsoleLogCleaner {
  private static readonly SOURCE_DIRS = ['src']
  private static readonly FILE_PATTERNS = ['**/*.ts', '**/*.tsx']
  private static readonly EXCLUDED_PATTERNS = [
    '**/test*/**',
    '**/__tests__/**', 
    '**/*.test.*',
    '**/*.spec.*',
    '**/scripts/**',
    '**/utils/debugUtils.ts',
    '**/utils/console-cleanup.ts'
  ]

  static async cleanupConsoleStatements(): Promise<CleanupResult> {
    const result: CleanupResult = {
      totalFiles: 0,
      modifiedFiles: 0,
      removedStatements: 0,
      skippedFiles: []
    }

    console.log('🧹 Starting console.log cleanup...')
    console.log('─'.repeat(60))

    for (const dir of this.SOURCE_DIRS) {
      if (!fs.existsSync(dir)) {
        console.log(`⚠️  Directory ${dir} not found, skipping...`)
        continue
      }

      const files = await this.getSourceFiles(dir)
      result.totalFiles += files.length

      for (const file of files) {
        if (this.shouldSkipFile(file)) {
          result.skippedFiles.push(file)
          continue
        }

        const cleanupFileResult = await this.cleanupFile(file)
        if (cleanupFileResult.modified) {
          result.modifiedFiles++
          result.removedStatements += cleanupFileResult.removedCount
          console.log(`✅ ${file}: Removed ${cleanupFileResult.removedCount} console.log statements`)
        }
      }
    }

    this.printSummary(result)
    return result
  }

  private static async getSourceFiles(dir: string): Promise<string[]> {
    const allFiles: string[] = []
    
    for (const pattern of this.FILE_PATTERNS) {
      const files = await glob(pattern, { 
        cwd: dir,
        ignore: this.EXCLUDED_PATTERNS,
        absolute: false 
      })
      allFiles.push(...files.map(f => path.join(dir, f)))
    }
    
    return [...new Set(allFiles)] // Remove duplicates
  }

  private static shouldSkipFile(file: string): boolean {
    // Skip if file matches excluded patterns
    return this.EXCLUDED_PATTERNS.some(pattern => {
      const globPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      const regex = new RegExp(globPattern)
      return regex.test(file)
    })
  }

  private static async cleanupFile(filePath: string): Promise<{ modified: boolean; removedCount: number }> {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const originalLines = content.split('\n')
      let removedCount = 0
      
      const cleanedLines = originalLines.filter(line => {
        // Remove lines that are primarily console.log statements
        const trimmed = line.trim()
        
        // Match various console.log patterns
        const consoleLogPatterns = [
          /^\s*console\.log\s*\([^)]*\)\s*;?\s*$/,     // Basic console.log()
          /^\s*console\.warn\s*\([^)]*\)\s*;?\s*$/,    // console.warn()
          /^\s*console\.error\s*\([^)]*\)\s*;?\s*$/,   // console.error()
          /^\s*console\.info\s*\([^)]*\)\s*;?\s*$/,    // console.info()
          /^\s*console\.debug\s*\([^)]*\)\s*;?\s*$/,   // console.debug()
        ]

        const shouldRemove = consoleLogPatterns.some(pattern => pattern.test(trimmed))
        
        if (shouldRemove) {
          removedCount++
          return false
        }
        
        return true
      })

      if (removedCount > 0) {
        fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8')
        return { modified: true, removedCount }
      }

      return { modified: false, removedCount: 0 }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error)
      return { modified: false, removedCount: 0 }
    }
  }

  private static printSummary(result: CleanupResult): void {
    console.log('')
    console.log('📊 CLEANUP SUMMARY')
    console.log('─'.repeat(60))
    console.log(`📁 Total files scanned: ${result.totalFiles}`)
    console.log(`✏️  Files modified: ${result.modifiedFiles}`)
    console.log(`🗑️  Console statements removed: ${result.removedStatements}`)
    console.log(`⏭️  Files skipped (tests/scripts): ${result.skippedFiles.length}`)
    console.log('')
    
    if (result.removedStatements > 0) {
      console.log('🎉 Production security improved!')
      console.log('✅ console.log statements removed from production code')
    } else {
      console.log('✅ No console.log statements found in production code')
    }
    
    console.log('')
    console.log('💡 Next steps:')
    console.log('   1. Review changes with git diff')
    console.log('   2. Test application functionality')
    console.log('   3. Commit changes: git add . && git commit -m "security: remove console.log statements"')
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  ConsoleLogCleaner.cleanupConsoleStatements()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Cleanup failed:', error)
      process.exit(1)
    })
}

export { ConsoleLogCleaner } 