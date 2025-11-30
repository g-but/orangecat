#!/usr/bin/env node

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🔍 Testing profile edit page...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser so you can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Log all console messages
  page.on('console', msg => console.log('🌐', msg.text()));

  // Log all errors
  page.on('pageerror', error => console.error('❌ Page error:', error));

  try {
    console.log('1. Navigating to homepage...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '.playwright-mcp/step1-home.png' });

    console.log('\n2. Checking authentication status...');
    const signInButton = await page.locator('text=/sign in|log in/i').count();

    if (signInButton > 0) {
      console.log('❌ Not authenticated. Please log in first.');
      console.log('   Keeping browser open for you to log in...');
      console.log('   After logging in, navigate to /dashboard/info/edit');
      await page.waitForTimeout(60000); // Wait 60 seconds for manual login
    } else {
      console.log('✓ Appears to be authenticated');
    }

    console.log('\n3. Navigating to edit page...');
    await page.goto(`${BASE_URL}/dashboard/info/edit`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '.playwright-mcp/step2-edit-page.png' });

    const url = page.url();
    console.log(`   Current URL: ${url}`);

    // Check for error page
    const notFound = await page.locator('text=/not found|404/i').count();
    if (notFound > 0) {
      console.log('❌ Page shows "Not Found" error');
      console.log('   This means the edit page is not accessible');

      // Check page HTML
      const html = await page.content();
      console.log('\n📄 Page HTML preview:');
      console.log(html.substring(0, 500));
    } else {
      console.log('✓ Edit page loaded');

      // Check for form
      const hasForm = await page.locator('form').count();
      const hasUsername = await page.locator('input').count();
      const hasSaveButton = await page.locator('button:has-text("Save")').count();

      console.log(`   Forms found: ${hasForm}`);
      console.log(`   Input fields: ${hasUsername}`);
      console.log(`   Save buttons: ${hasSaveButton}`);

      if (hasForm > 0) {
        console.log('\n4. Form is present! Testing submission...');

        // Try to click save (even without filling)
        const saveButton = page.locator('button:has-text("Save")').first();
        console.log('   Clicking save button...');
        await saveButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '.playwright-mcp/step3-after-save-click.png' });

        console.log('   Check browser console above for debug logs');
      }
    }

    console.log('\n✅ Test complete. Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    await page.screenshot({ path: '.playwright-mcp/error.png' });
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
