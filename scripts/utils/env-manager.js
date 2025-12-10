#!/usr/bin/env node

/**
 * ENVIRONMENT MANAGER
 *
 * A comprehensive tool for managing environment variables safely.
 * Provides backup, validation, and recovery features.
 *
 * Usage:
 *   node scripts/utils/env-manager.js backup    - Create backup
 *   node scripts/utils/env-manager.js validate  - Validate current env
 *   node scripts/utils/env-manager.js restore   - Restore from backup
 *   node scripts/utils/env-manager.js setup     - Initial setup
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

class EnvManager {
  constructor() {
    this.envFile = path.join(process.cwd(), '.env.local')
    this.backupDir = path.join(process.cwd(), '.env-backups')
    this.requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]
    this.optionalVars = [
      'GITHUB_TOKEN',
      'VERCEL_TOKEN',
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_SITE_NAME',
      'NEXT_PUBLIC_BITCOIN_ADDRESS',
      'NEXT_PUBLIC_LIGHTNING_ADDRESS'
    ]
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    }

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
  }

  createBackup() {
    if (!fs.existsSync(this.envFile)) {
      this.log('No .env.local file found to backup', 'warning')
      return null
    }

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }

    // Create backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const hash = crypto.createHash('md5')
      .update(fs.readFileSync(this.envFile))
      .digest('hex')
      .substring(0, 8)

    const backupFile = path.join(this.backupDir, `.env.local.${timestamp}.${hash}.backup`)

    fs.copyFileSync(this.envFile, backupFile)
    this.log(`✅ Backup created: ${path.basename(backupFile)}`, 'success')

    return backupFile
  }

  validateEnv() {
    if (!fs.existsSync(this.envFile)) {
      this.log('❌ .env.local file not found', 'error')
      return false
    }

    const content = fs.readFileSync(this.envFile, 'utf8')
    const envVars = {}

    // Parse environment variables
    content.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=')
        envVars[key] = valueParts.join('=')
      }
    })

    let isValid = true

    // Check required variables
    this.requiredVars.forEach(varName => {
      if (!envVars[varName] || envVars[varName].includes('placeholder') || envVars[varName].includes('your-')) {
        this.log(`❌ Missing or invalid: ${varName}`, 'error')
        isValid = false
      } else {
        this.log(`✅ ${varName}: Set`, 'success')
      }
    })

    // Check optional variables
    this.optionalVars.forEach(varName => {
      if (envVars[varName] && !envVars[varName].includes('your-')) {
        this.log(`✅ ${varName}: Set`, 'success')
      } else {
        this.log(`⚠️  ${varName}: Not set`, 'warning')
      }
    })

    return isValid
  }

  listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      this.log('No backup directory found', 'warning')
      return []
    }

    const backups = fs.readdirSync(this.backupDir)
      .filter(file => file.startsWith('.env.local.') && file.endsWith('.backup'))
      .map(file => path.join(this.backupDir, file))
      .sort()
      .reverse()

    if (backups.length === 0) {
      this.log('No backups found', 'warning')
    } else {
      this.log(`Found ${backups.length} backups:`, 'info')
      backups.forEach(backup => {
        const stats = fs.statSync(backup)
        const size = (stats.size / 1024).toFixed(1)
        console.log(`  📁 ${path.basename(backup)} (${size}KB)`)
      })
    }

    return backups
  }

  restoreBackup(backupFile = null) {
    const backups = this.listBackups()

    if (backups.length === 0) {
      this.log('No backups available to restore', 'error')
      return false
    }

    if (!backupFile) {
      backupFile = backups[0] // Use most recent
    }

    if (!fs.existsSync(backupFile)) {
      this.log(`Backup file not found: ${backupFile}`, 'error')
      return false
    }

    // Create backup of current file before restore
    if (fs.existsSync(this.envFile)) {
      this.createBackup()
    }

    fs.copyFileSync(backupFile, this.envFile)
    this.log(`✅ Restored from: ${path.basename(backupFile)}`, 'success')

    return true
  }

  setupInitialEnv() {
    if (fs.existsSync(this.envFile)) {
      this.log('.env.local already exists. Creating backup first...', 'warning')
      this.createBackup()
    }

    const envContent = `# OrangeCat Development Environment
# ====================================
#
# This file is managed by the Environment Manager
# Run: node scripts/utils/env-manager.js --help
#
# Last updated: ${new Date().toISOString()}
# Backups: .env-backups/ directory

# ==================== REQUIRED ====================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ohkueislstxomdjavyhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBtyxNUDYb4h3Y4K_16N1DNaY

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OrangeCat
NODE_ENV=development

# ==================== OPTIONAL ====================

# Bitcoin & Lightning
NEXT_PUBLIC_BITCOIN_ADDRESS=bc1qtkxw47wqlld9t0w7sujycl4mrmc90phypjygf6
NEXT_PUBLIC_LIGHTNING_ADDRESS=orangecat@getalby.com

# ==================== AUTH TOKENS ====================
# Use the auth scripts to set these securely:
# node scripts/auth/github-login.js
# node scripts/auth/vercel-login.js

# GitHub Configuration
# GITHUB_TOKEN=your_github_token_here

# Vercel Configuration
# VERCEL_TOKEN=your_vercel_token_here
`

    fs.writeFileSync(this.envFile, envContent)
    this.log('✅ Created initial .env.local file', 'success')
    this.log('🔄 Run: direnv reload', 'info')
  }

  showHelp() {
    console.log(`
🌍 OrangeCat Environment Manager
================================

USAGE:
  node scripts/utils/env-manager.js <command>

COMMANDS:
  setup      Create initial .env.local file
  backup     Create a backup of current .env.local
  validate   Check if all required variables are set
  restore    Restore from latest backup (or specify file)
  list       List all available backups
  help       Show this help message

EXAMPLES:
  node scripts/utils/env-manager.js setup
  node scripts/utils/env-manager.js backup
  node scripts/utils/env-manager.js validate
  node scripts/utils/env-manager.js restore
  node scripts/utils/env-manager.js list

AUTH SCRIPTS:
  node scripts/auth/github-login.js    - Login to GitHub securely
  node scripts/auth/vercel-login.js    - Login to Vercel securely

SAFETY FEATURES:
  • Automatic backups before any changes
  • Validation of required environment variables
  • Secure token management via OAuth
  • No sensitive data in version control
`)
  }

  async run() {
    const command = process.argv[2]

    switch (command) {
      case 'setup':
        this.setupInitialEnv()
        break

      case 'backup':
        this.createBackup()
        break

      case 'validate':
        this.validateEnv()
        break

      case 'restore':
        const backupFile = process.argv[3]
        this.restoreBackup(backupFile)
        break

      case 'list':
        this.listBackups()
        break

      case 'help':
      default:
        this.showHelp()
        break
    }
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new EnvManager()
  manager.run().catch(console.error)
}

module.exports = EnvManager




























