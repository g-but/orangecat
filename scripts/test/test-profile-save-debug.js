/**
 * Profile Save Debug Test
 * Tests profile saving and captures actual errors
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testProfileSave() {
  console.log('🧪 Testing profile save functionality...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('  🔴 Console Error:', msg.text());
    }
  });

  // Capture network errors
  page.on('response', response => {
    if (!response.ok() && response.url().includes('/api/profile')) {
      console.log(`  🔴 API Error: ${response.status()} ${response.statusText()}`);
      response
        .text()
        .then(text => {
          try {
            const errorData = JSON.parse(text);
            console.log('  Error Data:', JSON.stringify(errorData, null, 2));
          } catch (e) {
            console.log('  Error Response:', text);
          }
        })
        .catch(() => {});
    }
  });

  try {
    // Navigate to edit page (assuming already logged in or will be redirected)
    console.log('📝 Step 1: Navigating to profile edit page...');
    await page.goto(`${BASE_URL}/dashboard/info/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await page.waitForTimeout(3000);

    // Check if we're on the edit page or redirected
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('  ⚠️  Not logged in, cannot test save');
      console.log('  Please log in manually and run test again');
      await page.waitForTimeout(5000);
      await browser.close();
      return;
    }

    if (!currentUrl.includes('/edit')) {
      console.log('  ⚠️  Not on edit page, redirecting...');
      await page.goto(`${BASE_URL}/dashboard/info/edit`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }

    console.log('✅ On profile edit page\n');

    // Step 2: Fill in some test data
    console.log('📝 Step 2: Filling in test data...');

    // Try to find and fill location
    const locationInput = page
      .locator('input[placeholder*="city"], input[placeholder*="address"]')
      .first();
    if ((await locationInput.count()) > 0) {
      await locationInput.click();
      await page.waitForTimeout(500);
      await locationInput.fill('Zurich');
      await page.waitForTimeout(2000);
      // Try to click first suggestion if available
      const suggestion = page.locator('text=/Zurich/i').first();
      if ((await suggestion.count()) > 0) {
        await suggestion.click();
        await page.waitForTimeout(1000);
        console.log('  ✅ Location filled');
      } else {
        console.log('  ⚠️  Location suggestions not found, but input filled');
      }
    }

    // Try to find and fill phone
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"]').first();
    if ((await phoneInput.count()) > 0) {
      await phoneInput.fill('0783226939');
      await page.waitForTimeout(500);
      console.log('  ✅ Phone filled');
    }

    // Try to find and fill bio
    const bioInput = page.locator('textarea[name*="bio"]').first();
    if ((await bioInput.count()) > 0) {
      await bioInput.fill('Test bio for debugging profile save');
      await page.waitForTimeout(500);
      console.log('  ✅ Bio filled');
    }

    console.log('');

    // Step 3: Attempt to save
    console.log('💾 Step 3: Attempting to save...');

    // Find save button
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();

    if ((await saveButton.count()) === 0) {
      console.log('  ❌ Save button not found!');
      await page.screenshot({ path: 'test-save-button-missing.png', fullPage: true });
      console.log('  📸 Screenshot saved: test-save-button-missing.png');
    } else {
      const isEnabled = await saveButton.isEnabled();
      console.log(`  Save button found, enabled: ${isEnabled}`);

      if (!isEnabled) {
        console.log('  ⚠️  Save button is disabled, checking for validation errors...');
        // Check for error messages
        const errorMessages = page.locator('text=/error|invalid|required/i');
        const errorCount = await errorMessages.count();
        console.log(`  Found ${errorCount} potential error messages`);
        if (errorCount > 0) {
          for (let i = 0; i < Math.min(errorCount, 5); i++) {
            const text = await errorMessages.nth(i).textContent();
            console.log(`    - ${text}`);
          }
        }
      } else {
        // Scroll to button and click
        await saveButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        console.log('  Clicking save button...');
        await saveButton.click();

        // Wait for save to complete
        console.log('  Waiting for save to complete...');
        await page.waitForTimeout(5000);

        // Check for error toast
        const errorToast = page.locator('text=/failed|error/i');
        if ((await errorToast.count()) > 0) {
          const errorText = await errorToast.first().textContent();
          console.log(`  ❌ Error toast found: ${errorText}`);

          // Try to get more details
          const toastDescription = page.locator('[role="alert"]').first();
          if ((await toastDescription.count()) > 0) {
            const description = await toastDescription.textContent();
            console.log(`  Error details: ${description}`);
          }
        } else {
          // Check for success
          const successToast = page.locator('text=/success|saved/i');
          if ((await successToast.count()) > 0) {
            console.log('  ✅ Save appears successful!');
          } else {
            // Check if redirected
            const newUrl = page.url();
            if (newUrl.includes('/info') && !newUrl.includes('/edit')) {
              console.log('  ✅ Save successful (redirected to info page)');
            } else {
              console.log('  ⚠️  Save completed but unclear if successful');
            }
          }
        }
      }
    }

    console.log('');

    // Step 4: Check for errors
    console.log('🔍 Step 4: Checking for errors...');
    if (errors.length > 0) {
      console.log(`  Found ${errors.length} console errors:`);
      errors.forEach((err, i) => {
        console.log(`    ${i + 1}. ${err}`);
      });
    } else {
      console.log('  ✅ No console errors found');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-profile-save-result.png', fullPage: true });
    console.log('  📸 Screenshot saved: test-profile-save-result.png');

    console.log('\n📊 Test Summary:');
    console.log(`  - Console errors: ${errors.length}`);
    console.log(`  - Final URL: ${page.url()}`);
    console.log(`  - Save attempted: ${(await saveButton.count()) > 0 ? 'Yes' : 'No'}`);

    // Keep browser open for inspection
    console.log('\n⏸️  Browser will stay open for 15 seconds for inspection...');
    await page.waitForTimeout(15000);
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);

    // Take screenshot on error
    await page.screenshot({ path: 'test-profile-save-error.png', fullPage: true });
    console.log('📸 Screenshot saved: test-profile-save-error.png');
  } finally {
    await browser.close();
  }
}

testProfileSave().catch(console.error);




























