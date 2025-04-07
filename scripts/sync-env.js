#!/usr/bin/env node

/**
 * Environment Variable Synchronization Script
 * 
 * This script helps maintain synchronization between local and Vercel environment variables.
 * It reads from .env.local and uses the Vercel CLI to update the remote environment.
 * 
 * Usage:
 * - npm run env:push - Push local env vars to Vercel
 * - npm run env:pull - Pull Vercel env vars to local
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const ENV_FILE = path.join(process.cwd(), '.env.local');
const EXCLUDED_VARS = ['NODE_ENV']; // Variables to exclude from syncing
const ENVIRONMENTS = ['production']; // Vercel environments to update

// Ensure the user is logged in to Vercel
function ensureVercelLogin() {
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    console.log('✅ Vercel CLI authentication verified');
  } catch (error) {
    console.error('❌ Not logged in to Vercel CLI. Please run: vercel login');
    process.exit(1);
  }
}

// Read environment variables from .env.local
function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error(`❌ ${ENV_FILE} not found. Create this file with your environment variables.`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) return;
    
    // Parse key=value, handling quotes and complex values
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      envVars[key] = value;
    }
  });
  
  return envVars;
}

// Push environment variables to Vercel
async function pushToVercel() {
  ensureVercelLogin();
  
  const envVars = readEnvFile();
  const envKeys = Object.keys(envVars).filter(key => !EXCLUDED_VARS.includes(key));
  
  console.log(`📤 Pushing ${envKeys.length} environment variables to Vercel...`);
  
  for (const env of ENVIRONMENTS) {
    for (const key of envKeys) {
      const value = envVars[key];
      
      try {
        console.log(`⏳ Setting ${key} for ${env} environment...`);
        execSync(`vercel env add ${key} ${env}`, { 
          input: Buffer.from(`${value}\n`),
          stdio: ['pipe', 'inherit', 'inherit']
        });
      } catch (error) {
        console.error(`❌ Failed to set ${key}: ${error.message}`);
      }
    }
  }
  
  console.log('✅ Environment variables pushed to Vercel');
  
  // Deploy is handled by GitHub Actions or manually
  console.log('ℹ️ Remember to redeploy your application to apply these changes');
}

// Execute the script
(async function main() {
  try {
    await pushToVercel();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
})(); 