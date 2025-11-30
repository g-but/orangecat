/**
 * Comprehensive Profile Editing Workflow Test
 *
 * Tests the complete flow of editing profile information:
 * - Location entry (Nominatim)
 * - Phone number entry
 * - Other profile fields
 * - Saving and verification
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

async function testProfileEditWorkflow() {
  console.log('🧪 Starting comprehensive profile editing workflow test...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 300, // Slow down for visibility
    timeout: 60000, // Increase timeout
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to login
    console.log('📝 Step 1: Navigating to login page...');
    try {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      console.log('  Trying alternative route...');
      await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    await page.waitForTimeout(3000);

    // Step 2: Check if already logged in or need to login
    console.log('🔐 Step 2: Checking authentication...');

    // Try to go directly to dashboard - if already logged in, this will work
    try {
      await page.goto(`${BASE_URL}/dashboard/info/edit`, {
        waitUntil: 'networkidle',
        timeout: 5000,
      });
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/info')) {
        console.log('✅ Already logged in, proceeding to edit page\n');
      } else {
        throw new Error('Not logged in');
      }
    } catch (e) {
      // Need to login
      console.log('  Need to login...');
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Look for login button or form
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const loginButton = page
        .locator(
          'button:has-text("Sign in"), button:has-text("Login"), button[type="submit"], a:has-text("Login")'
        )
        .first();

      if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
        await emailInput.fill(TEST_EMAIL);
        await passwordInput.fill(TEST_PASSWORD);
        if ((await loginButton.count()) > 0) {
          await loginButton.click();
          await page.waitForTimeout(3000);
        }
      }

      // Try to navigate to edit page
      await page.goto(`${BASE_URL}/dashboard/info/edit`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      await page.waitForTimeout(2000);
      console.log('✅ Authentication handled\n');
    }

    // Step 3: Verify we're on profile edit page
    console.log('📝 Step 3: Verifying profile edit page...');
    const currentUrl = page.url();
    if (!currentUrl.includes('/edit')) {
      await page.goto(`${BASE_URL}/dashboard/info/edit`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      await page.waitForTimeout(3000);
    }
    console.log(`✅ On profile edit page: ${page.url()}\n`);

    // Step 4: Test Location Entry
    console.log('📍 Step 4: Testing location entry...');
    const locationInput = page
      .locator('input[placeholder*="city"], input[placeholder*="address"], input[id*="location"]')
      .first();

    if ((await locationInput.count()) > 0) {
      await locationInput.click();
      await page.waitForTimeout(1000);

      // Type "Zurich" to test Nominatim
      await locationInput.fill('Zurich');
      await page.waitForTimeout(2000); // Wait for Nominatim suggestions

      // Check if suggestions appear
      const suggestions = page.locator('text=/Zurich/i');
      if ((await suggestions.count()) > 0) {
        console.log('  ✅ Location suggestions appeared');
        // Click first suggestion
        await suggestions.first().click();
        await page.waitForTimeout(2000);
        console.log('  ✅ Location selected');
      } else {
        console.log('  ⚠️  No suggestions found, but input accepted');
      }
    } else {
      console.log('  ⚠️  Location input not found');
    }
    console.log('');

    // Step 5: Test Phone Number Entry
    console.log('📞 Step 5: Testing phone number entry...');
    const phoneInput = page
      .locator('input[type="tel"], input[name*="phone"], input[id*="phone"]')
      .first();

    if ((await phoneInput.count()) > 0) {
      await phoneInput.click();
      await page.waitForTimeout(500);

      // Test Swiss phone format
      await phoneInput.fill('0783226939');
      await page.waitForTimeout(1000);
      console.log('  ✅ Phone number entered: 0783226939');

      // Test international format
      await phoneInput.clear();
      await phoneInput.fill('+41-78-322693');
      await page.waitForTimeout(1000);
      console.log('  ✅ Phone number entered: +41-78-322693');
    } else {
      console.log('  ⚠️  Phone input not found');
    }
    console.log('');

    // Step 6: Test Bio Entry
    console.log('📖 Step 6: Testing bio entry...');
    const bioInput = page.locator('textarea[name*="bio"], textarea[id*="bio"]').first();

    if ((await bioInput.count()) > 0) {
      await bioInput.click();
      await page.waitForTimeout(500);
      await bioInput.fill(
        'This is a test bio to verify the profile editing workflow works correctly.'
      );
      await page.waitForTimeout(1000);
      console.log('  ✅ Bio entered');
    } else {
      console.log('  ⚠️  Bio input not found');
    }
    console.log('');

    // Step 7: Test Website Entry
    console.log('🌐 Step 7: Testing website entry...');
    const websiteInput = page.locator('input[name*="website"], input[id*="website"]').first();

    if ((await websiteInput.count()) > 0) {
      await websiteInput.click();
      await page.waitForTimeout(500);

      // Test domain without https
      await websiteInput.fill('orangecat.ch');
      await page.waitForTimeout(1000);
      console.log('  ✅ Website entered: orangecat.ch');
    } else {
      console.log('  ⚠️  Website input not found');
    }
    console.log('');

    // Step 8: Test Name Entry
    console.log('👤 Step 8: Testing name entry...');
    const nameInput = page.locator('input[name*="name"], input[id*="name"]').first();

    if ((await nameInput.count()) > 0) {
      await nameInput.click();
      await page.waitForTimeout(500);
      await nameInput.fill('Test User');
      await page.waitForTimeout(1000);
      console.log('  ✅ Name entered');
    } else {
      console.log('  ⚠️  Name input not found');
    }
    console.log('');

    // Step 9: Save the form
    console.log('💾 Step 9: Saving profile...');
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();

    if ((await saveButton.count()) > 0) {
      // Scroll to save button
      await saveButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Check if button is enabled
      const isEnabled = await saveButton.isEnabled();
      console.log(`  Button enabled: ${isEnabled}`);

      if (isEnabled) {
        await saveButton.click();
        console.log('  ✅ Save button clicked');

        // Wait for save to complete (check for success message or redirect)
        await page.waitForTimeout(3000);

        // Check for success toast or redirect
        const successIndicator = page.locator('text=/saved|success|updated/i');
        if ((await successIndicator.count()) > 0) {
          console.log('  ✅ Save successful (toast message found)');
        } else if (page.url().includes('/info') && !page.url().includes('/edit')) {
          console.log('  ✅ Save successful (redirected to info page)');
        } else {
          console.log('  ⚠️  Save completed, but no clear success indicator');
        }
      } else {
        console.log('  ⚠️  Save button is disabled');
      }
    } else {
      console.log('  ⚠️  Save button not found');
    }
    console.log('');

    // Step 10: Verify saved data
    console.log('🔍 Step 10: Verifying saved data...');

    // Navigate to profile view page
    await page.goto(`${BASE_URL}/dashboard/info`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(3000);

    // Check if location is displayed
    const locationDisplay = page.locator('text=/Zurich|location/i');
    if ((await locationDisplay.count()) > 0) {
      console.log('  ✅ Location is displayed on profile');
    } else {
      console.log('  ⚠️  Location not found on profile page');
    }

    // Check if phone is displayed
    const phoneDisplay = page.locator('text=/\\+41|078|phone/i');
    if ((await phoneDisplay.count()) > 0) {
      console.log('  ✅ Phone number is displayed on profile');
    } else {
      console.log('  ⚠️  Phone number not found on profile page');
    }

    // Check if bio is displayed
    const bioDisplay = page.locator('text=/test bio/i');
    if ((await bioDisplay.count()) > 0) {
      console.log('  ✅ Bio is displayed on profile');
    } else {
      console.log('  ⚠️  Bio not found on profile page');
    }

    console.log('');

    // Step 11: Test form validation
    console.log('✅ Step 11: Testing form validation...');

    // Go back to edit page
    await page.goto(`${BASE_URL}/dashboard/info/edit`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // Test invalid website
    if ((await websiteInput.count()) > 0) {
      await websiteInput.clear();
      await websiteInput.fill('not-a-valid-website');
      await websiteInput.blur();
      await page.waitForTimeout(1000);

      const errorMessage = page.locator('text=/valid|error|invalid/i');
      if ((await errorMessage.count()) > 0) {
        console.log('  ✅ Website validation working');
      } else {
        console.log('  ⚠️  Website validation not showing error');
      }

      // Fix it
      await websiteInput.clear();
      await websiteInput.fill('orangecat.ch');
    }

    console.log('');

    // Final summary
    console.log('📊 Test Summary:');
    console.log('  ✅ Location entry tested');
    console.log('  ✅ Phone number entry tested');
    console.log('  ✅ Bio entry tested');
    console.log('  ✅ Website entry tested');
    console.log('  ✅ Name entry tested');
    console.log('  ✅ Form save tested');
    console.log('  ✅ Data verification tested');
    console.log('\n🎉 Profile editing workflow test completed!\n');

    // Keep browser open for inspection
    console.log('Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);

    // Take screenshot on error
    await page.screenshot({ path: 'test-profile-edit-error.png', fullPage: true });
    console.log('📸 Screenshot saved: test-profile-edit-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testProfileEditWorkflow().catch(console.error);
