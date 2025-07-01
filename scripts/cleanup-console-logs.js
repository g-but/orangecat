#!/usr/bin/env node
/**
 * CONSOLE.LOG CLEANUP SCRIPT
 * 
 * Created: 2025-01-09
 * Purpose: Remove 193 console.log statements from codebase for production security
 * 
 * Security Risk: console.log statements can expose sensitive data in production
 * Compliance: Ensures production code follows security best practices
 */

const fs = require('fs')
const path = require('path')

class ConsoleLogCleaner {
  static SOURCE_DIRS = ['src']
  static FILE_PATTERNS = ['.ts', '.tsx']
  static EXCLUDED_PATTERNS = [
    'test',
    '__tests__',
    '.test.',
    '.spec.',
    'scripts',
    'debugUtils',
    'console-cleanup'
  ]

  static async cleanupConsoleStatements() {
    const result = {
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

      const files = this.getSourceFiles(dir)
      result.totalFiles += files.length

      for (const file of files) {
        if (this.shouldSkipFile(file)) {
          result.skippedFiles.push(file)
          continue
        }

        const cleanupFileResult = this.cleanupFile(file)
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

  static getSourceFiles(dir) {
    const allFiles = []
    const FILE_PATTERNS = this.FILE_PATTERNS
    
    function walkDir(currentDir) {
      const files = fs.readdirSync(currentDir)
      
      for (const file of files) {
        const filePath = path.join(currentDir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          walkDir(filePath)
        } else if (FILE_PATTERNS.some(ext => file.endsWith(ext))) {
          allFiles.push(filePath)
        }
      }
    }
    
    walkDir(dir)
    return allFiles
  }

  static shouldSkipFile(file) {
    return this.EXCLUDED_PATTERNS.some(pattern => file.includes(pattern))
  }

  static cleanupFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const originalLines = content.split('\n')
      let removedCount = 0
      
      const cleanedLines = originalLines.filter(line => {
        const trimmed = line.trim()
        
        const consoleLogPatterns = [
          /^\s*console\.log\s*\([^)]*\)\s*;?\s*$/,
          /^\s*console\.warn\s*\([^)]*\)\s*;?\s*$/,
          /^\s*console\.error\s*\([^)]*\)\s*;?\s*$/,
          /^\s*console\.info\s*\([^)]*\)\s*;?\s*$/,
          /^\s*console\.debug\s*\([^)]*\)\s*;?\s*$/,
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
      console.error(`❌ Error processing ${filePath}:`, error.message)
      return { modified: false, removedCount: 0 }
    }
  }

  static printSummary(result) {
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

if (require.main === module) {
  ConsoleLogCleaner.cleanupConsoleStatements()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Cleanup failed:', error)
      process.exit(1)
    })
}

module.exports = { ConsoleLogCleaner } 