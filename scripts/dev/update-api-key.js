#!/usr/bin/env node

/**
 * Simple API Key Update Script
 *
 * This script provides a simple interface to update the Supabase API key
 * in the .env.local file with proper validation.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const PROJECT_REF = 'ohkueislstxomdjavyhs';
const DASHBOARD_URL = `https://app.supabase.com/project/${PROJECT_REF}/settings/api`;
const ENV_FILE_PATH = path.join(__dirname, '..', '.env.local');

function createBackup() {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    console.error(`❌ Error: .env.local file not found at: ${ENV_FILE_PATH}`);
    process.exit(1);
  }

  const backupPath = `${ENV_FILE_PATH}.backup.${Date.now()}`;
  fs.copyFileSync(ENV_FILE_PATH, backupPath);
  console.log(`💾 Created backup: ${backupPath}`);
  return backupPath;
}

function validateApiKey(apiKey) {
  if (!apiKey) {
    return { valid: false, message: 'API key is empty' };
  }

  if (!apiKey.startsWith('eyJ')) {
    return { valid: false, message: 'JWT tokens should start with "eyJ"' };
  }

  if (!apiKey.includes('.')) {
    return { valid: false, message: 'JWT tokens should contain dots' };
  }

  const parts = apiKey.split('.');
  if (parts.length !== 3) {
    return { valid: false, message: 'JWT tokens should have exactly 3 parts separated by dots' };
  }

  if (apiKey.length < 100) {
    return { valid: false, message: 'API key seems too short' };
  }

  return { valid: true, message: 'Valid' };
}

function updateEnvFile(newApiKey) {
  let content = fs.readFileSync(ENV_FILE_PATH, 'utf8');

  const pattern = /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/;
  const replacement = `NEXT_PUBLIC_SUPABASE_ANON_KEY="${newApiKey}"`;

  if (pattern.test(content)) {
    content = content.replace(pattern, replacement);
    console.log('✅ Updated existing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  } else {
    content = content.trim() + `\n${replacement}\n`;
    console.log('✅ Added new NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  fs.writeFileSync(ENV_FILE_PATH, content);
  console.log('📝 .env.local file updated successfully!');
}

async function promptForApiKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('🔑 Paste the anon public API key here: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🚀 Supabase API Key Update Script');
  console.log(`📍 Project Reference: ${PROJECT_REF}`);
  console.log(`🌐 Dashboard URL: ${DASHBOARD_URL}`);
  console.log();

  console.log('🔍 How to get your API key:');
  console.log('1. Open the dashboard URL above in your browser');
  console.log('2. Log in to your Supabase account');
  console.log('3. Look for the "anon public" key in the API settings');
  console.log('4. Copy the key (it starts with "eyJ" and is quite long)');
  console.log();

  console.log('🧭 What to look for on the Supabase dashboard:');
  console.log('• A table with API keys');
  console.log('• A row labeled "anon" or "public"');
  console.log('• A long string starting with "eyJ"');
  console.log('• A copy button next to the key');
  console.log();

  console.log('🔧 DOM Elements and Selectors:');
  console.log('• CSS Selector: [data-testid*="anon"]');
  console.log('• CSS Selector: [data-testid*="api-key"]');
  console.log('• Elements: <code>, <pre>, table cells');
  console.log('• Classes: .api-key, .anon-key');
  console.log();

  // Create backup
  createBackup();

  // Get API key from user
  while (true) {
    const apiKey = await promptForApiKey();

    const validation = validateApiKey(apiKey);
    if (validation.valid) {
      console.log('✅ API key validation passed');
      console.log(`🔑 Key preview: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 20)}`);

      updateEnvFile(apiKey);

      console.log();
      console.log('🎉 Success! API key has been updated in .env.local');
      console.log('🔧 You can now restart your development server to use the new key');
      console.log();
      console.log('To verify the update:');
      console.log(`  grep NEXT_PUBLIC_SUPABASE_ANON_KEY ${ENV_FILE_PATH}`);
      break;
    } else {
      console.log(`❌ Error: ${validation.message}`);
      console.log('Please try again or press Ctrl+C to exit.');
    }
  }
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Supabase API Key Update Script

Usage: node scripts/update-api-key.js

This script helps you update the NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.

Steps:
1. Navigate to: ${DASHBOARD_URL}
2. Copy the anon public API key
3. Paste it when prompted by this script

The script will:
- Create a backup of your .env.local file
- Validate the API key format
- Update the .env.local file with the new key
`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { validateApiKey, updateEnvFile };