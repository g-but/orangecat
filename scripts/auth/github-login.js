#!/usr/bin/env node

/**
 * INTERACTIVE GITHUB LOGIN SCRIPT
 *
 * This script helps you authenticate with GitHub and store tokens securely.
 * It uses OAuth Device Flow for secure authentication without exposing credentials.
 *
 * Usage: node scripts/auth/github-login.js
 */

const https = require('https')
const { URL } = require('url')
const fs = require('fs')
const path = require('path')

class GitHubAuth {
  constructor() {
    this.clientId = 'Iv1.b507a08c87ecfe98' // OrangeCat's OAuth App
    this.deviceCodeUrl = 'https://github.com/login/device/code'
    this.tokenUrl = 'https://github.com/login/oauth/access_token'
    this.envFile = path.join(process.cwd(), '.env.local')
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            resolve(data)
          }
        })
      })

      req.on('error', reject)

      if (options.body) {
        req.write(options.body)
      }

      req.end()
    })
  }

  async requestDeviceCode() {
    console.log('🔗 Requesting device code from GitHub...')

    const response = await this.makeRequest(this.deviceCodeUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `client_id=${this.clientId}&scope=repo,read:user,user:email`
    })

    if (response.error) {
      throw new Error(`GitHub API Error: ${response.error_description}`)
    }

    return response
  }

  async pollForToken(deviceCode, interval) {
    console.log('⏳ Polling for authentication...')

    const startTime = Date.now()
    const timeout = 15 * 60 * 1000 // 15 minutes

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval * 1000))

      const response = await this.makeRequest(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `client_id=${this.clientId}&device_code=${deviceCode}&grant_type=urn:ietf:params:oauth:grant-type:device_code`
      })

      if (response.access_token) {
        return response.access_token
      }

      if (response.error === 'authorization_pending') {
        console.log('⏳ Still waiting for authorization...')
        continue
      }

      if (response.error === 'slow_down') {
        interval += 5
        console.log(`🐌 Slowing down polling to ${interval}s intervals...`)
        continue
      }

      if (response.error === 'expired_token') {
        throw new Error('Device code expired. Please run the script again.')
      }

      throw new Error(`Authentication failed: ${response.error_description}`)
    }

    throw new Error('Authentication timeout. Please try again.')
  }

  async updateEnvFile(token) {
    console.log('💾 Updating .env.local with GitHub token...')

    // Create backup
    if (fs.existsSync(this.envFile)) {
      const backupFile = `${this.envFile}.backup.${Date.now()}`
      fs.copyFileSync(this.envFile, backupFile)
      console.log(`💾 Backup created: ${path.basename(backupFile)}`)
    }

    let envContent = ''
    if (fs.existsSync(this.envFile)) {
      envContent = fs.readFileSync(this.envFile, 'utf8')
    }

    // Remove existing GITHUB_TOKEN lines
    envContent = envContent.split('\n')
      .filter(line => !line.startsWith('GITHUB_TOKEN='))
      .join('\n')

    // Add new token
    if (!envContent.includes('# GitHub Configuration')) {
      envContent += '\n\n# GitHub Configuration\n'
    }
    envContent += `GITHUB_TOKEN=${token}\n`

    fs.writeFileSync(this.envFile, envContent)
    console.log('✅ GitHub token saved to .env.local')
  }

  async run() {
    try {
      console.log('🚀 GITHUB OAUTH LOGIN')
      console.log('====================')

      // Request device code
      const deviceData = await this.requestDeviceCode()

      console.log('\n📱 Go to: https://github.com/login/device')
      console.log(`🔑 Enter code: ${deviceData.user_code}`)
      console.log('\n⏳ Waiting for authorization...')

      // Poll for token
      const token = await this.pollForToken(deviceData.device_code, deviceData.interval)

      // Update environment file
      await this.updateEnvFile(token)

      console.log('\n🎉 SUCCESS! GitHub authentication complete.')
      console.log('🔄 Restart your terminal or run: direnv reload')
      console.log('📝 Token saved to .env.local')

    } catch (error) {
      console.error('❌ ERROR:', error.message)
      process.exit(1)
    }
  }
}

// Run if called directly
if (require.main === module) {
  const auth = new GitHubAuth()
  auth.run()
}

module.exports = GitHubAuth




























