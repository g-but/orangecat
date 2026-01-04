#!/usr/bin/env node

/**
 * Browser Automation Helper for OrangeCat
 * 
 * Provides reliable browser automation utilities for testing and debugging.
 * Uses Playwright for robust, cross-browser testing.
 * 
 * Usage:
 *   node scripts/test/browser-automation-helper.mjs [command] [options]
 * 
 * Commands:
 *   test-messages    - Test messaging functionality
 *   test-auth        - Test authentication flow
 *   test-profile     - Test profile editing
 *   interactive      - Start interactive browser session
 * 
 * Options:
 *   --url=<url>      - Base URL (default: http://localhost:3001)
 *   --headless       - Run in headless mode
 *   --slow           - Slow down actions (2s delay)
 *   --screenshot     - Take screenshots at each step
 * 
 * Created: 2026-01-03
 * Last Modified: 2026-01-03
 * Last Modified Summary: Browser automation helper for reliable testing
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0] || 'interactive';
const options = {
  url: args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3001',
  headless: args.includes('--headless'),
  slow: args.includes('--slow'),
  screenshot: args.includes('--screenshot'),
};

const delay = options.slow ? 2000 : 500;

/**
 * Wait for element with multiple strategies
 */
async function waitForElement(page, selector, options = {}) {
  const { timeout = 10000, visible = true } = options;
  
  try {
    // Try direct selector first
    await page.waitForSelector(selector, { state: visible ? 'visible' : 'attached', timeout });
    return await page.locator(selector).first();
  } catch (e) {
    // Try by text
    try {
      return await page.getByText(selector).first();
    } catch (e2) {
      // Try by role
      try {
        return await page.getByRole('button', { name: selector }).first();
      } catch (e3) {
        throw new Error(`Element not found: ${selector}`);
      }
    }
  }
}

/**
 * Safe click with retry
 */
async function safeClick(page, selector, options = {}) {
  const { retries = 3, waitAfter = delay } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      // Close any modals/overlays first
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      const element = await waitForElement(page, selector);
      await element.scrollIntoViewIfNeeded();
      await element.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(waitAfter);
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Safe fill with retry
 */
async function safeFill(page, selector, text, options = {}) {
  const { retries = 3, waitAfter = delay } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      const element = await waitForElement(page, selector);
      await element.clear();
      await element.fill(text);
      await element.press('Tab'); // Trigger validation
      await page.waitForTimeout(waitAfter);
      return true;
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Take screenshot if enabled
 */
async function takeScreenshot(page, name) {
  if (options.screenshot) {
    const screenshotDir = join(__dirname, '../../browser-screenshots');
    await page.screenshot({ 
      path: join(screenshotDir, `${name}.png`),
      fullPage: true 
    });
    console.log(`📸 Screenshot: ${name}.png`);
  }
}

/**
 * Test messaging flow
 */
async function testMessages() {
  const browser = await chromium.launch({ 
    headless: options.headless,
    devtools: !options.headless 
  });
  
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    console.log('🧪 Testing Messaging Flow\n');
    
    // Navigate to messages
    console.log('📍 Step 1: Navigate to messages');
    await page.goto(`${options.url}/messages`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-messages-page');
    
    // Wait for conversations to load
    console.log('📍 Step 2: Wait for conversations');
    await page.waitForSelector('[href*="/profiles/"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Click on existing conversation
    console.log('📍 Step 3: Click conversation');
    const conversationLink = page.locator('[href*="/profiles/"]').first();
    await conversationLink.click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '02-conversation-open');
    
    // Find message input
    console.log('📍 Step 4: Find message input');
    const messageInput = page.locator('textarea, input[type="text"], [contenteditable="true"]')
      .filter({ hasText: /message|type/i })
      .first();
    
    if (await messageInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await safeFill(page, messageInput, 'Hello! This is a test message from browser automation.');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '03-message-sent');
      console.log('✅ Message sent');
    } else {
      console.log('⚠️  Message input not found');
    }
    
    console.log('\n✅ Messaging test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await takeScreenshot(page, 'error');
  } finally {
    if (!options.headless) {
      console.log('\n⏸️  Browser will stay open. Press Enter to close...');
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    }
    await browser.close();
  }
}

/**
 * Test authentication flow
 */
async function testAuth() {
  const browser = await chromium.launch({ 
    headless: options.headless,
    devtools: !options.headless 
  });
  
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    console.log('🧪 Testing Authentication Flow\n');
    
    // Navigate to auth page
    console.log('📍 Step 1: Navigate to auth page');
    await page.goto(`${options.url}/auth`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-auth-page');
    
    // Fill email
    console.log('📍 Step 2: Fill email');
    await safeFill(page, 'input[type="email"], input[name="email"]', 'metal@music.com');
    
    // Fill password
    console.log('📍 Step 3: Fill password');
    await safeFill(page, 'input[type="password"]', 'MetalMusic123!');
    
    // Click sign in
    console.log('📍 Step 4: Click sign in');
    await safeClick(page, 'button:has-text("Sign in"), button[type="submit"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '02-after-login');
    
    // Check if logged in
    const url = page.url();
    if (url.includes('/dashboard') || url.includes('/messages')) {
      console.log('✅ Login successful');
    } else {
      console.log('⚠️  Login may have failed, current URL:', url);
    }
    
    console.log('\n✅ Authentication test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await takeScreenshot(page, 'error');
  } finally {
    if (!options.headless) {
      console.log('\n⏸️  Browser will stay open. Press Enter to close...');
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    }
    await browser.close();
  }
}

/**
 * Interactive browser session
 */
async function interactive() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const page = await browser.newPage();
  page.setViewportSize({ width: 1920, height: 1080 });
  
  console.log('🌐 Interactive Browser Session');
  console.log('Navigate to:', options.url);
  console.log('Browser will stay open. Close manually when done.\n');
  
  await page.goto(options.url);
  
  // Keep browser open
  await new Promise(() => {});
}

// Run command
switch (command) {
  case 'test-messages':
    testMessages();
    break;
  case 'test-auth':
    testAuth();
    break;
  case 'interactive':
    interactive();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log('Available commands: test-messages, test-auth, interactive');
    process.exit(1);
}
