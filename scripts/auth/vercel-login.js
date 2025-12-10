#!/usr/bin/env node

/**
 * INTERACTIVE VERCEL LOGIN SCRIPT
 *
 * This script helps you authenticate with Vercel and store tokens securely.
 * It uses Vercel's CLI login flow for secure authentication.
 *
 * Usage: node scripts/auth/vercel-login.js
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class VercelAuth {
  constructor() {
    this.envFile = path.join(process.cwd(), '.env.local')
  }

  async runVercelLogin() {
    return new Promise((resolve, reject) => {
      console.log('🔗 Starting Vercel CLI login...')

      const vercel = spawn('npx', ['vercel', 'login'], {
        stdio: 'inherit',
        shell: true
      })

      vercel.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Vercel login successful')
          resolve()
        } else {
          reject(new Error(`Vercel login failed with exit code ${code}`))
        }
      })

      vercel.on('error', (error) => {
        reject(new Error(`Failed to start Vercel CLI: ${error.message}`))
      })
    })
  }

  async getVercelToken() {
    return new Promise((resolve, reject) => {
      console.log('🔑 Getting Vercel access token...')

      const vercel = spawn('npx', ['vercel', 'token', 'add', 'orangecat-dev', '--yes'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      })

      let stdout = ''
      let stderr = ''

      vercel.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      vercel.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      vercel.on('close', (code) => {
        if (code === 0) {
          // Extract token from output
          const tokenMatch = stdout.match(/Token: (\w+)/) || stdout.match(/(\w{64,})/)
          if (tokenMatch) {
            resolve(tokenMatch[1])
          } else {
            console.log('⚠️  Could not extract token automatically.')
            console.log('📋 Please run: npx vercel token add orangecat-dev')
            console.log('📋 Then add the token manually to .env.local as VERCEL_TOKEN')
            resolve(null)
          }
        } else {
          console.log('⚠️  Could not get token automatically.')
          console.log('📋 Please run: npx vercel token add orangecat-dev')
          console.log('📋 Then add the token manually to .env.local as VERCEL_TOKEN')
          resolve(null)
        }
      })

      vercel.on('error', (error) => {
        reject(new Error(`Failed to get Vercel token: ${error.message}`))
      })
    })
  }

  async updateEnvFile(token) {
    if (!token) return

    console.log('💾 Updating .env.local with Vercel token...')

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

    // Remove existing VERCEL_TOKEN lines
    envContent = envContent.split('\n')
      .filter(line => !line.startsWith('VERCEL_TOKEN='))
      .join('\n')

    // Add new token
    if (!envContent.includes('# Vercel Configuration')) {
      envContent += '\n\n# Vercel Configuration\n'
    }
    envContent += `VERCEL_TOKEN=${token}\n`

    fs.writeFileSync(this.envFile, envContent)
    console.log('✅ Vercel token saved to .env.local')
  }

  async run() {
    try {
      console.log('🚀 VERCEL OAUTH LOGIN')
      console.log('===================')

      // Run Vercel login
      await this.runVercelLogin()

      // Get token
      const token = await this.getVercelToken()

      // Update environment file
      if (token) {
        await this.updateEnvFile(token)
        console.log('\n🎉 SUCCESS! Vercel authentication complete.')
        console.log('🔄 Restart your terminal or run: direnv reload')
        console.log('📝 Token saved to .env.local')
      } else {
        console.log('\n⚠️  Manual token setup required.')
        console.log('📋 Add your Vercel token to .env.local as VERCEL_TOKEN')
      }

    } catch (error) {
      console.error('❌ ERROR:', error.message)
      console.log('\n🔧 Manual setup instructions:')
      console.log('   1. Run: npx vercel login')
      console.log('   2. Run: npx vercel token add orangecat-dev')
      console.log('   3. Add the token to .env.local as VERCEL_TOKEN')
      process.exit(1)
    }
  }
}

// Run if called directly
if (require.main === module) {
  const auth = new VercelAuth()
  auth.run()
}

module.exports = VercelAuth




























