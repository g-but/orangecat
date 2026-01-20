#!/usr/bin/env node

/**
 * Health Check Script for OrangeCat
 * 
 * Validates that all required environment variables are present and properly configured.
 * Run this before starting the dev server to catch credential issues early.
 * 
 * Usage: node scripts/health-check.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const { red, green, yellow, blue, cyan, reset } = colors;

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error(`${red}✗ Error: .env.local file not found!${reset}`);
    console.log(`\n${yellow}Setup Instructions:${reset}`);
    console.log(`  1. Copy .env.example to .env.local:`);
    console.log(`     ${cyan}cp .env.example .env.local${reset}`);
    console.log(`  2. Pull credentials from Vercel:`);
    console.log(`     ${cyan}vercel env pull .env.local --environment=production --yes${reset}`);
    console.log(`  3. Add GitHub token:`);
    console.log(`     ${cyan}gh auth token${reset} and add to GITHUB_TOKEN in .env.local`);
    console.log(`  4. Optional: Add OpenRouter API key for platform-level AI\n`);
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        env[key] = value;
      }
    }
  });
  
  return env;
}

// Required credentials categories
const requiredCredentials = {
  'Supabase (Auth & Database)': [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', validate: val => val && !val.includes('example') },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', validate: val => val && val.startsWith('eyJ') },
    { key: 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY',
      validate: val => val && (val.startsWith('eyJ') || val.startsWith('sb_secret_')),
      checkFunc: env => env['SUPABASE_SERVICE_ROLE_KEY'] || env['SUPABASE_SECRET_KEY'] },
  ],
  'Postgres (Direct Access - Optional for Scripts)': [
    { key: 'POSTGRES_HOST', validate: val => val && val.includes('supabase.co') },
  ],
  'GitHub (Repo Integration)': [
    { key: 'GITHUB_TOKEN', validate: val => val && (val.startsWith('ghp_') || val.startsWith('gho_')) },
  ],
  'Bitcoin/Lightning (Payments)': [
    { key: 'NEXT_PUBLIC_BITCOIN_ADDRESS', validate: val => val && val.startsWith('bitcoin:') },
    { key: 'NEXT_PUBLIC_LIGHTNING_ADDRESS', validate: val => val && val.includes('@') },
  ],
};

// Optional but recommended credentials
const optionalCredentials = {
  'Postgres Direct Connection (Scripts Only)': [
    { key: 'POSTGRES_URL', validate: val => val && val.startsWith('postgresql://') },
  ],
  'OpenRouter (AI - Optional for BYOK)': [
    { key: 'OPENROUTER_API_KEY', validate: val => val && val.startsWith('sk-or-') },
  ],
};

// Check credential category
function checkCategory(env, categoryName, credentials) {
  console.log(`\n${blue}${categoryName}${reset}`);
  console.log('─'.repeat(60));
  
  let allPresent = true;
  let allValid = true;
  
  credentials.forEach(({ key, validate, checkFunc }) => {
    const value = checkFunc ? checkFunc(env) : env[key];
    const isPresent = !!value;
    const isValid = isPresent && validate(value);
    
    if (!isPresent) {
      console.log(`  ${red}✗${reset} ${key}: ${red}MISSING${reset}`);
      allPresent = false;
      allValid = false;
    } else if (!isValid) {
      console.log(`  ${yellow}⚠${reset} ${key}: ${yellow}INVALID/PLACEHOLDER${reset}`);
      allValid = false;
    } else {
      console.log(`  ${green}✓${reset} ${key}: ${green}OK${reset}`);
    }
  });
  
  return { allPresent, allValid };
}

// Main health check
function healthCheck() {
  console.log(`${cyan}╔═══════════════════════════════════════════════════════════╗${reset}`);
  console.log(`${cyan}║     OrangeCat Environment Health Check                    ║${reset}`);
  console.log(`${cyan}╚═══════════════════════════════════════════════════════════╝${reset}`);
  
  const env = loadEnv();
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required credentials
  console.log(`\n${blue}Required Credentials:${reset}`);
  Object.entries(requiredCredentials).forEach(([category, creds]) => {
    const { allPresent, allValid } = checkCategory(env, category, creds);
    if (!allPresent) hasErrors = true;
    if (!allValid) hasWarnings = true;
  });
  
  // Check optional credentials
  console.log(`\n${blue}Optional Credentials:${reset}`);
  Object.entries(optionalCredentials).forEach(([category, creds]) => {
    checkCategory(env, category, creds);
  });
  
  // Summary
  console.log(`\n${cyan}═══════════════════════════════════════════════════════════${reset}`);
  
  if (hasErrors) {
    console.log(`\n${red}✗ Health Check FAILED${reset}`);
    console.log(`\n${yellow}Missing required credentials. Follow these steps:${reset}`);
    console.log(`  1. Pull credentials from Vercel:`);
    console.log(`     ${cyan}vercel env pull .env.local --environment=production --yes${reset}`);
    console.log(`  2. Add GitHub token:`);
    console.log(`     Run: ${cyan}gh auth token${reset}`);
    console.log(`     Then add to ${cyan}GITHUB_TOKEN${reset} in .env.local`);
    console.log(`  3. Re-run this script to verify\n`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`\n${yellow}⚠ Health Check WARNING${reset}`);
    console.log(`Some credentials may be invalid or placeholders.`);
    console.log(`App may not work correctly until these are fixed.\n`);
    process.exit(0);
  } else {
    console.log(`\n${green}✓ Health Check PASSED${reset}`);
    console.log(`All required credentials are present and valid.`);
    console.log(`\n${cyan}You can start the development server:${reset}`);
    console.log(`  ${cyan}npm run dev${reset}\n`);
    process.exit(0);
  }
}

// Run health check
healthCheck();
