#!/usr/bin/env node

/**
 * Supabase Environment Setup Script
 *
 * Helps set up the correct Supabase environment variables for local development
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function setupEnvironment() {
  console.log('🔧 OrangeCat Supabase Environment Setup');
  console.log('========================================\n');

  // Check if .env.local already exists
  const envExists = fs.existsSync(ENV_FILE_PATH);

  if (envExists) {
    console.log('📄 Found existing .env.local file');
    const overwrite = await askQuestion('Do you want to update it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled');
      return;
    }
  }

  console.log('\n📋 You need your Supabase project credentials.');
  console.log('   You can find them at: https://app.supabase.com/project/YOUR_PROJECT/settings/api');
  console.log('');

  // Get Supabase URL
  const supabaseUrl = await askQuestion('Enter your Supabase Project URL (e.g., https://your-project.supabase.co): ');

  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    console.error('❌ Invalid Supabase URL. It should end with .supabase.co');
    process.exit(1);
  }

  // Get Supabase Anon Key
  const supabaseKey = await askQuestion('Enter your Supabase anon/public key (starts with eyJ...): ');

  if (!supabaseKey || !supabaseKey.startsWith('eyJ')) {
    console.error('❌ Invalid Supabase key. It should start with "eyJ"');
    process.exit(1);
  }

  // Create .env.local content
  const envContent = `# OrangeCat Development Environment Variables
# ==========================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OrangeCat

# Environment
NODE_ENV=development

# Optional configurations (add as needed)
# NEXT_PUBLIC_ANALYTICS_ENABLED=false
# NEXT_PUBLIC_BITCOIN_ADDRESS=your-test-bitcoin-address
# NEXT_PUBLIC_LIGHTNING_ADDRESS=your-test@lightning.address
`;

  // Write the file
  fs.writeFileSync(ENV_FILE_PATH, envContent);

  console.log('\n✅ Environment file created/updated successfully!');
  console.log(`📄 Location: ${ENV_FILE_PATH}`);
  console.log('\n🚀 You can now run:');
  console.log('   npm run d');
  console.log('\n🔍 To test the connection:');
  console.log('   node scripts/check-database-data.js');

  // Test the connection
  console.log('\n🧪 Testing database connection...');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1);

    if (profilesError) {
      console.log('⚠️ Connection test failed - this might be normal if tables don\'t exist yet');
      console.log(`   Error: ${profilesError.message}`);
    } else {
      console.log('✅ Database connection successful!');
      console.log(`   Found ${profiles.length} profile(s) in database`);
    }
  } catch (error) {
    console.log('⚠️ Connection test failed - check your credentials');
    console.log(`   Error: ${error.message}`);
  }
}

// Run the setup
if (require.main === module) {
  setupEnvironment().catch(console.error);
}

