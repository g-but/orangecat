#!/usr/bin/env node

/**
 * OAUTH CONFIGURATION TEST SCRIPT
 *
 * Tests if OAuth providers are properly configured and working.
 * Run this after setting up OAuth credentials to verify everything works.
 *
 * Usage: node scripts/test-oauth-config.js
 */

const https = require('https')
require('dotenv').config({ path: '.env.local' })

class OAuthTest {
  constructor() {
    this.errors = []
    this.warnings = []
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
      this.errors.push(message)
    } else if (type === 'warning') {
      this.warnings.push(message)
    }
  }

  checkEnvironmentVariables() {
    this.log('🔍 CHECKING ENVIRONMENT VARIABLES', 'info')

    const requiredVars = [
      'SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID',
      'SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET',
      'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID',
      'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET',
      'SUPABASE_AUTH_EXTERNAL_TWITTER_CLIENT_ID',
      'SUPABASE_AUTH_EXTERNAL_TWITTER_SECRET'
    ]

    let allPresent = true

    for (const varName of requiredVars) {
      const value = process.env[varName]
      if (!value || value.includes('your-') || value.length < 10) {
        this.log(`❌ ${varName}: Missing or invalid`, 'error')
        allPresent = false
      } else {
        this.log(`✅ ${varName}: Present`, 'success')
      }
    }

    if (allPresent) {
      this.log('✅ All OAuth environment variables are configured', 'success')
    } else {
      this.log('❌ Some OAuth environment variables are missing or invalid', 'error')
    }

    return allPresent
  }

  async testSupabaseConnection() {
    this.log('🔍 TESTING SUPABASE CONNECTION', 'info')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      this.log('❌ Supabase URL or anon key missing', 'error')
      return false
    }

    try {
      // Test basic connectivity
      await new Promise((resolve, reject) => {
        const req = https.request(supabaseUrl.replace('https://', ''), {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          }
        }, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve()
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        })

        req.on('error', reject)
        req.setTimeout(5000, () => {
          req.destroy()
          reject(new Error('Timeout'))
        })
        req.end()
      })

      this.log('✅ Supabase connection test passed', 'success')
      return true

    } catch (error) {
      this.log(`❌ Supabase connection test failed: ${error.message}`, 'error')
      return false
    }
  }

  async testAuthEndpoint() {
    this.log('🔍 TESTING AUTHENTICATION ENDPOINT', 'info')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.orangecat.ch'

    try {
      // Test the auth page loads
      await new Promise((resolve, reject) => {
        const req = https.request(`${siteUrl}/auth`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; OAuthTest/1.0)'
          }
        }, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            if (res.statusCode === 200 && data.includes('auth')) {
              resolve()
            } else {
              reject(new Error(`HTTP ${res.statusCode}`))
            }
          })
        })

        req.on('error', reject)
        req.setTimeout(10000, () => {
          req.destroy()
          reject(new Error('Timeout'))
        })
        req.end()
      })

      this.log('✅ Authentication page loads successfully', 'success')
      return true

    } catch (error) {
      this.log(`❌ Authentication page test failed: ${error.message}`, 'error')
      return false
    }
  }

  generateSummary() {
    this.log('📊 OAUTH CONFIGURATION TEST SUMMARY', 'info')
    this.log('====================================', 'info')

    if (this.errors.length === 0) {
      this.log('🎉 ALL TESTS PASSED!', 'success')
      this.log('', 'info')
      this.log('✅ Environment variables: Configured', 'success')
      this.log('✅ Supabase connection: Working', 'success')
      this.log('✅ Auth page: Loading', 'success')
      this.log('', 'info')
      this.log('🚀 Next steps:', 'info')
      this.log('   1. Go to https://orangecat.ch/auth', 'info')
      this.log('   2. Check that social login buttons are visible', 'info')
      this.log('   3. Test each OAuth provider', 'info')
      this.log('   4. Verify users can authenticate successfully', 'info')
    } else {
      this.log(`❌ ${this.errors.length} ERRORS FOUND`, 'error')
      this.log('', 'info')
      this.errors.forEach(error => {
        this.log(`   ❌ ${error}`, 'error')
      })

      if (this.warnings.length > 0) {
        this.log('', 'info')
        this.warnings.forEach(warning => {
          this.log(`   ⚠️ ${warning}`, 'warning')
        })
      }

      this.log('', 'info')
      this.log('🔧 FIXES NEEDED:', 'info')
      this.log('   1. Check OAUTH_SETUP_GUIDE.md for detailed instructions', 'info')
      this.log('   2. Verify OAuth app credentials are correct', 'info')
      this.log('   3. Ensure Supabase providers are enabled', 'info')
      this.log('   4. Check redirect URLs match exactly', 'info')
    }
  }

  async run() {
    try {
      this.log('🚀 STARTING OAUTH CONFIGURATION TEST', 'info')
      this.log('=====================================', 'info')

      // Test environment variables
      const envOk = this.checkEnvironmentVariables()

      // Test Supabase connection
      const supabaseOk = await this.testSupabaseConnection()

      // Test auth endpoint
      const authOk = await this.testAuthEndpoint()

      // Generate summary
      this.generateSummary()

      const allTestsPassed = envOk && supabaseOk && authOk && this.errors.length === 0

      if (allTestsPassed) {
        this.log('🎉 OAUTH CONFIGURATION IS READY!', 'success')
        return { success: true, errors: this.errors }
      } else {
        this.log('❌ OAUTH CONFIGURATION NEEDS FIXES', 'error')
        return { success: false, errors: this.errors }
      }

    } catch (error) {
      this.log(`💥 TEST FAILED: ${error.message}`, 'error')
      return { success: false, errors: [error.message] }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const test = new OAuthTest()
  test.run().then(result => {
    if (!result.success) {
      process.exit(1)
    }
  }).catch(error => {
    console.error('❌ Test crashed:', error)
    process.exit(1)
  })
}

module.exports = OAuthTest


