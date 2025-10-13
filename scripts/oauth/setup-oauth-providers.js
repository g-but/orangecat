#!/usr/bin/env node

/**
 * OAUTH PROVIDER SETUP SCRIPT
 *
 * This script helps set up OAuth providers for OrangeCat authentication.
 * It creates the .env.local file with proper configuration and provides
 * step-by-step instructions for configuring providers in Supabase.
 *
 * Usage: node scripts/setup-oauth-providers.js
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

class OAuthSetup {
  constructor() {
    this.envFilePath = path.join(process.cwd(), '.env.local')
    this.errors = []
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    }

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)

    if (type === 'error') {
      this.errors.push({ timestamp, message })
    }
  }

  createEnvFile() {
    try {
      const envContent = `# OrangeCat Environment Variables
# Copy this file and fill in the actual values from your Supabase dashboard

# ==================== REQUIRED ENVIRONMENT VARIABLES ====================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ohkueislstxomdjavyhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDc5NTAsImV4cCI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBtyxNUDYb4h3Y4K_16N1DNaY

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.orangecat.ch
NEXT_PUBLIC_SITE_NAME=OrangeCat

# ==================== OAUTH PROVIDER CONFIGURATION ====================
# Configure these in your Supabase Dashboard under Authentication > Providers

# GitHub OAuth (Required for GitHub login)
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=your-github-client-id
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=your-github-client-secret

# Google OAuth (Required for Google login)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret

# X/Twitter OAuth (Required for Twitter/X login)
SUPABASE_AUTH_EXTERNAL_TWITTER_CLIENT_ID=your-twitter-client-id
SUPABASE_AUTH_EXTERNAL_TWITTER_SECRET=your-twitter-client-secret

# Alternative X provider (if Twitter doesn't work)
SUPABASE_AUTH_EXTERNAL_X_CLIENT_ID=your-x-client-id
SUPABASE_AUTH_EXTERNAL_X_SECRET=your-x-client-secret

# ==================== SETUP INSTRUCTIONS ====================

# 1. Copy this file to .env.local (already done)
# 2. Fill in all the OAuth credentials above
# 3. Set up OAuth providers in Supabase Dashboard:
#    - Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/auth
#    - Enable GitHub, Google, and Twitter/X providers
#    - Add your OAuth credentials
#    - Set redirect URLs to: https://www.orangecat.ch/auth/callback
# 4. Restart your development server
`

      fs.writeFileSync(this.envFilePath, envContent)
      this.log('✅ Created .env.local file with OAuth configuration', 'success')

    } catch (error) {
      this.log(`❌ Failed to create .env.local file: ${error.message}`, 'error')
      throw error
    }
  }

  displaySetupInstructions() {
    this.log('🚀 OAUTH PROVIDER SETUP INSTRUCTIONS', 'info')
    this.log('=====================================', 'info')

    this.log('', 'info')
    this.log('📋 STEP 1: Configure OAuth Providers in Supabase Dashboard', 'info')
    this.log('   Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/auth', 'info')
    this.log('   Enable the following providers:', 'info')
    this.log('   • GitHub', 'info')
    this.log('   • Google', 'info')
    this.log('   • Twitter/X', 'info')
    this.log('', 'info')

    this.log('📋 STEP 2: Set up GitHub OAuth', 'info')
    this.log('   1. Go to: https://github.com/settings/applications/new', 'info')
    this.log('   2. Application name: OrangeCat', 'info')
    this.log('   3. Homepage URL: https://www.orangecat.ch', 'info')
    this.log('   4. Authorization callback URL: https://www.orangecat.ch/auth/callback', 'info')
    this.log('   5. Copy Client ID and Client Secret to .env.local', 'info')
    this.log('', 'info')

    this.log('📋 STEP 3: Set up Google OAuth', 'info')
    this.log('   1. Go to: https://console.cloud.google.com/', 'info')
    this.log('   2. Create/select project and enable Google+ API', 'info')
    this.log('   3. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs', 'info')
    this.log('   4. Application type: Web application', 'info')
    this.log('   5. Authorized redirect URIs: https://www.orangecat.ch/auth/callback', 'info')
    this.log('   6. Copy Client ID and Client Secret to .env.local', 'info')
    this.log('', 'info')

    this.log('📋 STEP 4: Set up Twitter/X OAuth', 'info')
    this.log('   1. Go to: https://developer.twitter.com/en/portal/dashboard', 'info')
    this.log('   2. Create/select app', 'info')
    this.log('   3. App permissions: Read', 'info')
    this.log('   4. Authentication settings: Enable OAuth 2.0', 'info')
    this.log('   5. Callback URLs: https://www.orangecat.ch/auth/callback', 'info')
    this.log('   6. Copy API Key (Client ID) and API Key Secret (Client Secret) to .env.local', 'info')
    this.log('', 'info')

    this.log('📋 STEP 5: Update .env.local file', 'info')
    this.log('   Edit .env.local and replace "your-*-client-id" and "your-*-client-secret"', 'info')
    this.log('   with the actual values from the OAuth provider dashboards', 'info')
    this.log('', 'info')

    this.log('📋 STEP 6: Restart development server', 'info')
    this.log('   Run: npm run dev', 'info')
    this.log('', 'info')

    this.log('🎯 TROUBLESHOOTING:', 'info')
    this.log('   • If "provider is not enabled" error: Check Supabase dashboard provider settings', 'warning')
    this.log('   • If redirect URL error: Make sure callback URL matches exactly', 'warning')
    this.log('   • If credentials error: Verify Client ID and Secret are correct', 'warning')
    this.log('', 'info')
  }

  run() {
    try {
      this.log('🚀 STARTING OAUTH PROVIDER SETUP', 'info')
      this.log('=================================', 'info')

      // Create .env.local file
      this.createEnvFile()

      // Display setup instructions
      this.displaySetupInstructions()

      this.log('✅ OAUTH PROVIDER SETUP COMPLETE', 'success')
      this.log('=================================', 'success')

      this.log('🌐 Next steps:', 'info')
      this.log('   1. Follow the setup instructions above', 'info')
      this.log('   2. Update .env.local with real OAuth credentials', 'info')
      this.log('   3. Restart development server: npm run dev', 'info')
      this.log('   4. Test authentication at: https://orangecat.ch/auth', 'info')

    } catch (error) {
      this.log(`💥 SETUP FAILED: ${error.message}`, 'error')
      throw error
    }
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new OAuthSetup()
  setup.run()
}

module.exports = OAuthSetup


