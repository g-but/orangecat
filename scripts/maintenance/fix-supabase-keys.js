#!/usr/bin/env node

/**
 * 🔧 OrangeCat Supabase Key Fixer
 *
 * This script helps you get and update fresh API keys for your restored Supabase project.
 * Run this script to automatically fix the API key issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧡 OrangeCat Supabase Key Fixer');
console.log('==================================\n');

const projectRef = 'ohkueislstxomdjavyhs';
const envPath = path.join(__dirname, '..', '.env.local');

console.log(`📋 Project Reference: ${projectRef}`);
console.log(`🔗 Dashboard URL: https://app.supabase.com/project/${projectRef}/settings/api\n`);

// Function to test if Supabase CLI is available
function hasSupabaseCLI() {
  try {
    execSync('npx supabase --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Function to test current connection
async function testConnection(apiKey) {
  try {
    const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/`, {
      headers: { 'apikey': apiKey }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking current API key...');

  // Read current env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const currentKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/);
  const currentKey = currentKeyMatch ? currentKeyMatch[1] : null;

  if (currentKey) {
    console.log(`📝 Current key: ${currentKey.substring(0, 20)}...`);

    const isWorking = await testConnection(currentKey);
    if (isWorking) {
      console.log('✅ Current API key is working! No changes needed.');
      return;
    } else {
      console.log('❌ Current API key is invalid (401 error)');
    }
  }

  console.log('\n🛠️  Getting fresh API keys...\n');

  if (hasSupabaseCLI()) {
    console.log('🔧 Attempting to use Supabase CLI...');
    try {
      // Try to get project info with CLI
      console.log('Please run the following commands manually:');
      console.log('1. npx supabase login');
      console.log('2. npx supabase projects list');
      console.log(`3. npx supabase projects api-keys --project-ref ${projectRef}`);
    } catch (error) {
      console.log('❌ CLI method failed, using manual method...');
    }
  }

  console.log('\n📖 MANUAL STEPS (Recommended):');
  console.log('==============================');
  console.log(`1. Open: https://app.supabase.com/project/${projectRef}/settings/api`);
  console.log('2. Copy the "anon public" key');
  console.log('3. Replace the key in your .env.local file');
  console.log('4. Restart your development server');

  console.log('\n🔄 Current .env.local location:');
  console.log(`   ${envPath}`);

  console.log('\n💡 After updating the key, run:');
  console.log('   npm run dev');
  console.log('   node test-supabase-connection.js');

  // Wait for user input
  console.log('\n⏳ Press Enter after you\'ve updated the API key...');

  // Create a simple input prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('', async () => {
      rl.close();

      // Re-read and test the updated key
      console.log('\n🔍 Testing updated API key...');
      const updatedContent = fs.readFileSync(envPath, 'utf8');
      const updatedKeyMatch = updatedContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/);
      const updatedKey = updatedKeyMatch ? updatedKeyMatch[1] : null;

      if (updatedKey && updatedKey !== currentKey) {
        const isWorking = await testConnection(updatedKey);
        if (isWorking) {
          console.log('🎉 SUCCESS! New API key is working!');
          console.log('✅ OrangeCat is now ready to use!');
        } else {
          console.log('❌ New key still not working. Please check the key and try again.');
        }
      } else {
        console.log('⚠️  No changes detected in .env.local file.');
      }

      resolve();
    });
  });
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testConnection };