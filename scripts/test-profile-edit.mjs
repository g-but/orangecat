#!/usr/bin/env node

/**
 * Autonomous browser test for profile editing
 * Tests the complete flow: login, navigate to edit, fill form, save
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

async function runTest() {
  console.log('🚀 Starting profile edit test...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Enable console log capture
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('===') || text.includes('Error') || text.includes('error')) {
      console.log(`📋 Browser console: ${text}`);
    }
  });

  try {
    console.log('1️⃣  Navigating to home page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '.playwright-mcp/01-homepage.png' });
    console.log('   ✓ Homepage loaded');

    // Check if already logged in
    const isLoggedIn = await page.locator('text=Dashboard').count() > 0;

    if (!isLoggedIn) {
      console.log('\n2️⃣  Logging in...');
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });

      // Try to fill login form if it exists
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill(TEST_EMAIL);
        await page.locator('input[type="password"]').fill(TEST_PASSWORD);
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '.playwright-mcp/02-after-login.png' });
        console.log('   ✓ Login submitted');
      } else {
        console.log('   ⚠️  No login form found - may already be logged in');
      }
    } else {
      console.log('\n2️⃣  Already logged in, skipping login step');
    }

    console.log('\n3️⃣  Navigating to profile edit page...');
    await page.goto(`${BASE_URL}/dashboard/info/edit`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/03-edit-page.png' });
    console.log('   ✓ Edit page loaded');

    // Check for error banner
    const errorBanner = await page.locator('.bg-red-50').count();
    if (errorBanner > 0) {
      console.log('   ⚠️  Validation errors detected on page load');
      const errorText = await page.locator('.bg-red-50').textContent();
      console.log('   Error details:', errorText);
    }

    console.log('\n4️⃣  Filling form fields...');

    // Wait for form to be ready
    await page.waitForSelector('input[placeholder*="username"]', { timeout: 5000 });

    // Fill username if empty
    const usernameInput = page.locator('input[placeholder*="username"]').first();
    const currentUsername = await usernameInput.inputValue();
    if (!currentUsername) {
      await usernameInput.fill('testuser123');
      console.log('   ✓ Filled username');
    } else {
      console.log(`   ℹ️  Username already set: ${currentUsername}`);
    }

    // Fill name
    const nameInput = page.locator('input[placeholder*="display name"]').first();
    await nameInput.fill('Test User');
    console.log('   ✓ Filled name');

    // Fill bio
    const bioTextarea = page.locator('textarea[placeholder*="story"]').first();
    await bioTextarea.fill('This is a test bio for autonomous testing.');
    console.log('   ✓ Filled bio');

    // Fill website
    const websiteInput = page.locator('input[placeholder*="website"]').first();
    await websiteInput.fill('https://test-website.com');
    console.log('   ✓ Filled website');

    await page.screenshot({ path: '.playwright-mcp/04-form-filled.png' });

    console.log('\n5️⃣  Submitting form...');

    // Click save button
    const saveButton = page.locator('button[type="submit"]', { hasText: 'Save Profile' });
    await saveButton.click();
    console.log('   ✓ Save button clicked');

    // Wait a bit for submission
    await page.waitForTimeout(2000);

    // Check for errors
    const errorBannerAfterSubmit = await page.locator('.bg-red-50').count();
    if (errorBannerAfterSubmit > 0) {
      console.log('   ❌ Validation errors after submit:');
      const errorText = await page.locator('.bg-red-50').textContent();
      console.log('   ', errorText);
      await page.screenshot({ path: '.playwright-mcp/05-submit-error.png' });
      throw new Error('Form validation failed');
    }

    // Check if we got redirected to view mode
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('/dashboard/info/edit')) {
      console.log('   ⚠️  Still on edit page - checking for errors...');
      await page.screenshot({ path: '.playwright-mcp/05-still-on-edit.png' });
    } else if (currentUrl.includes('/dashboard/info')) {
      console.log('   ✓ Redirected to view mode - save successful!');
      await page.screenshot({ path: '.playwright-mcp/05-success-redirect.png' });
    }

    // Look for success toast
    const successToast = await page.locator('text=saved successfully').count();
    if (successToast > 0) {
      console.log('   ✓ Success toast displayed');
    }

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: '.playwright-mcp/error-state.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
runTest()
  .then(() => {
    console.log('🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
