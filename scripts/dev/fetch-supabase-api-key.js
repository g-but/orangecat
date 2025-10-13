#!/usr/bin/env node

/**
 * Automated Supabase API Key Retrieval Script
 *
 * This script uses Puppeteer to automate the process of:
 * 1. Navigating to the Supabase project settings API page
 * 2. Extracting the anon public API key
 * 3. Updating the .env.local file with the fresh key
 *
 * Usage: node scripts/fetch-supabase-api-key.js
 *
 * Prerequisites:
 * - You must be logged into Supabase in your default browser
 * - Or provide credentials via environment variables
 */

// Use dynamic import for Puppeteer to avoid require issues
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('Puppeteer not found locally, trying npx...');
  process.exit(1);
}
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_PROJECT_REF = 'ohkueislstxomdjavyhs';
const DASHBOARD_URL = `https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/settings/api`;
const ENV_FILE_PATH = path.join(__dirname, '..', '.env.local');

// Selectors for Supabase dashboard elements
const SELECTORS = {
  // Common selectors that might be used for the anon key
  anonKeySection: '[data-testid="anon-key"]',
  anonKeyValue: '[data-testid="anon-key-value"]',
  apiKeyContainer: '.api-key-container',
  copyButton: '[aria-label*="copy"]',
  apiKeysTable: 'table',
  anonPublicRow: 'tr:has-text("anon"), tr:has-text("public")',

  // Alternative selectors to try
  codeBlocks: 'code',
  preBlocks: 'pre',
  spanWithLongText: 'span[class*="code"], span[class*="token"]',

  // Authentication selectors (if needed)
  loginForm: 'form[action*="login"]',
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  signInButton: 'button[type="submit"], button:has-text("Sign in")'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractApiKey(page) {
  console.log('🔍 Searching for anon public API key...');

  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  await delay(2000);

  // Strategy 1: Look for dedicated anon key elements
  const strategies = [
    async () => {
      console.log('📋 Strategy 1: Looking for dedicated anon key elements...');
      const selectors = [
        '[data-testid*="anon"]',
        '[data-testid*="api-key"]',
        '.anon-key',
        '.api-key'
      ];

      for (const selector of selectors) {
        try {
          const elements = await page.$$(selector);
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.startsWith('eyJ') && text.length > 100) {
              return text.trim();
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      return null;
    },

    async () => {
      console.log('📋 Strategy 2: Scanning all code/pre blocks...');
      const codeElements = await page.$$('code, pre, span[class*="code"]');

      for (const element of codeElements) {
        try {
          const text = await element.textContent();
          if (text && text.startsWith('eyJ') && text.length > 100) {
            // Additional validation: JWT tokens have 3 parts separated by dots
            const parts = text.split('.');
            if (parts.length === 3) {
              return text.trim();
            }
          }
        } catch (e) {
          // Continue to next element
        }
      }
      return null;
    },

    async () => {
      console.log('📋 Strategy 3: Looking in tables for anon/public key...');
      const tables = await page.$$('table');

      for (const table of tables) {
        try {
          const rows = await table.$$('tr');
          for (const row of rows) {
            const rowText = await row.textContent();
            if (rowText && (rowText.includes('anon') || rowText.includes('public'))) {
              // Look for JWT token in this row
              const cells = await row.$$('td, th');
              for (const cell of cells) {
                const cellText = await cell.textContent();
                if (cellText && cellText.startsWith('eyJ') && cellText.length > 100) {
                  return cellText.trim();
                }
              }
            }
          }
        } catch (e) {
          // Continue to next table
        }
      }
      return null;
    },

    async () => {
      console.log('📋 Strategy 4: Full page text search...');
      const bodyText = await page.textContent('body');

      // Look for JWT tokens in the page text
      const jwtRegex = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
      const matches = bodyText.match(jwtRegex);

      if (matches && matches.length > 0) {
        // Return the longest match (likely the most complete token)
        return matches.sort((a, b) => b.length - a.length)[0];
      }
      return null;
    }
  ];

  // Try each strategy
  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result) {
        console.log('✅ Found API key!');
        return result;
      }
    } catch (error) {
      console.log(`⚠️ Strategy failed: ${error.message}`);
    }
  }

  throw new Error('❌ Could not find anon public API key on the page');
}

async function updateEnvFile(newApiKey) {
  console.log('📝 Updating .env.local file...');

  if (!fs.existsSync(ENV_FILE_PATH)) {
    throw new Error(`❌ .env.local file not found at: ${ENV_FILE_PATH}`);
  }

  let envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');

  // Replace the existing NEXT_PUBLIC_SUPABASE_ANON_KEY
  const anonKeyRegex = /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/;

  if (anonKeyRegex.test(envContent)) {
    envContent = envContent.replace(anonKeyRegex, `NEXT_PUBLIC_SUPABASE_ANON_KEY="${newApiKey}"`);
    console.log('✅ Updated existing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  } else {
    // Add the key if it doesn't exist
    envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${newApiKey}"\n`;
    console.log('✅ Added new NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Create backup
  const backupPath = `${ENV_FILE_PATH}.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, fs.readFileSync(ENV_FILE_PATH));
  console.log(`💾 Created backup at: ${backupPath}`);

  // Write updated content
  fs.writeFileSync(ENV_FILE_PATH, envContent);
  console.log('✅ .env.local file updated successfully!');
}

async function main() {
  console.log('🚀 Starting Supabase API key retrieval...');
  console.log(`📍 Target URL: ${DASHBOARD_URL}`);

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    console.log('🌐 Navigating to Supabase dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a moment for dynamic content to load
    await delay(3000);

    // Check if we're on a login page
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('🔐 Login required. Please log in manually in the browser window...');
      console.log('💡 The script will wait for you to complete authentication.');

      // Wait for navigation away from login page
      await page.waitForFunction(
        () => !window.location.href.includes('login') && !window.location.href.includes('auth'),
        { timeout: 300000 } // 5 minutes timeout
      );

      console.log('✅ Authentication detected, continuing...');
      await delay(2000);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/supabase-dashboard.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/supabase-dashboard.png');

    // Extract the API key
    const apiKey = await extractApiKey(page);

    console.log('🔑 API Key found:', apiKey.substring(0, 20) + '...');

    // Update the .env.local file
    await updateEnvFile(apiKey);

    console.log('🎉 Success! API key has been updated in .env.local');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
Supabase API Key Retrieval Script

Usage: node scripts/fetch-supabase-api-key.js [options]

Options:
  --help          Show this help message
  --headless      Run in headless mode (no browser window)

Environment Variables:
  SUPABASE_EMAIL     Your Supabase account email (for auto-login)
  SUPABASE_PASSWORD  Your Supabase account password (for auto-login)

Example:
  node scripts/fetch-supabase-api-key.js
  SUPABASE_EMAIL=user@example.com SUPABASE_PASSWORD=password node scripts/fetch-supabase-api-key.js --headless
`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { extractApiKey, updateEnvFile };