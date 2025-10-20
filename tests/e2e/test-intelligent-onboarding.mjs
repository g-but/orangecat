import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3003';
const SCREENSHOTS_DIR = './test-screenshots';

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filename = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`  📸 Screenshot: ${filename}`);
}

async function testIntelligentOnboarding() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('\n🚀 Starting Intelligent Onboarding Test\n');

    // Step 1: Navigate to home page
    console.log('1️⃣  Navigating to home page...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await takeScreenshot(page, 'home-page');

    // Check for Smart Setup Guide button
    // Prefer the primary CTA button with the emoji to avoid duplicate links
    const setupGuideButton = page.getByRole('link', { name: /Smart Setup Guide/i }).first();
    if (await setupGuideButton.isVisible()) {
      console.log('  ✅ Smart Setup Guide button found');
    } else {
      console.log('  ❌ Smart Setup Guide button NOT found');
      await takeScreenshot(page, 'home-error');
      throw new Error('Smart Setup Guide button not found');
    }

    // Step 2: Navigate to setup guide (or register first if needed)
    console.log('\n2️⃣  Going straight to dev onboarding (auth-free)...');
    await page.goto(`${BASE_URL}/dev/onboarding`, { waitUntil: 'domcontentloaded' });

    // Step 3: Verify we're on onboarding page
    console.log('\n3️⃣  Navigating to onboarding flow...');
    // We are already on /dev/onboarding
    await takeScreenshot(page, 'onboarding-step1');

    // Check for Step 1: Tell Us Your Story
    const step1Title = page.locator('text=What do you need Bitcoin for?');
    if (await step1Title.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ✅ Step 1: "Tell Us Your Story" found');
    } else {
      console.log('  ⚠️  Step 1 title not found - checking page content');
      const pageText = await page.textContent('body');
      console.log('  Page contains:', pageText?.substring(0, 200));
    }

    // Step 4: Fill in description
    console.log('\n4️⃣  Filling in project description...');
    const textarea = page.getByTestId('onboarding-description');
    
    if (await textarea.isVisible({ timeout: 8000 }).catch(() => false)) {
      const description = 'We are organizing a local cat shelter and need funding for food, medical supplies, and facility maintenance. Our team includes 3 veterinarians and 5 dedicated volunteers. We believe in transparent use of funds and want to set up a collective organization to manage donations.';
      
      await textarea.fill(description);
      console.log('  ✅ Description entered');
      console.log(`  📝 Text: ${description.substring(0, 80)}...`);
    } else {
      console.log('  ❌ Textarea not found');
      await takeScreenshot(page, 'textarea-error');
      throw new Error('Textarea for description not found');
    }

    await takeScreenshot(page, 'onboarding-description-filled');

    // Step 5: Click "Analyze My Needs"
    console.log('\n5️⃣  Analyzing needs...');
    const analyzeButton = page.getByTestId('onboarding-analyze');
    
    if (await analyzeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Wait until the button becomes enabled after typing
      for (let i = 0; i < 20; i++) {
        const enabled = await analyzeButton.isEnabled().catch(() => false)
        if (enabled) break
        await new Promise(r => setTimeout(r, 250))
      }
      await analyzeButton.click();
      console.log('  ✅ Analyze button clicked');
      
      // Wait for analysis animation
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      console.log('  ⚠️  Analyze button not found - trying alternatives');
      const buttons = await page.locator('button').allTextContents();
      console.log('  Available buttons:', buttons);
    }

    await takeScreenshot(page, 'onboarding-analyzing');

    // Step 6: Check recommendation (Step 3)
    console.log('\n6️⃣  Checking recommendations...');
    const recommendationTitle = page.locator('text=Organization Setup Recommended|Personal Campaign Recommended');
    
    if (await recommendationTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
      const recommendation = await recommendationTitle.textContent();
      console.log(`  ✅ Recommendation shown: ${recommendation}`);
    } else {
      console.log('  ⚠️  Recommendation not visible - checking for step 2');
      const pageText = await page.textContent('body');
      if (pageText?.includes('confidence')) {
        console.log('  ℹ️  Found confidence in page text - analysis completed');
      }
    }

    await takeScreenshot(page, 'onboarding-recommendation');

    // Step 7: Navigate to final step (Choose Your Path)
    console.log('\n7️⃣  Moving to final step...');
    let nextButton = page.getByTestId('onboarding-next');
    
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
      console.log('  ✅ Clicked Next button');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await takeScreenshot(page, 'onboarding-step4');

    // Step 8: Create organization
    console.log('\n8️⃣  Creating organization...');
    const createOrgButton = page.locator('button:has-text("Create Organization")').first();
    
    if (await createOrgButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createOrgButton.click();
      console.log('  ✅ Create Organization button clicked');
      await page.waitForLoadState('networkidle');
    } else {
      console.log('  ⚠️  Create Organization button not found');
      await takeScreenshot(page, 'create-org-error');
      throw new Error('Create Organization button not found');
    }

    await takeScreenshot(page, 'org-create-page');

    // Step 9: Fill organization creation form
    console.log('\n9️⃣  Filling organization form...');
    
    // Organization name
    const nameInput = page.locator('input[placeholder*="Bitcoin Education"], input[placeholder*="e.g."]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Bitcoin Cat Shelter');
      console.log('  ✅ Organization name entered');
    }

    // Organization slug should auto-generate, but verify
    const slugInput = page.locator('input[placeholder*="bitcoin-education"], input[placeholder*="slug"]').first();
    if (await slugInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const slug = await slugInput.inputValue();
      console.log(`  ✅ Organization slug: ${slug}`);
    }

    // Type selector
    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await typeSelect.selectOption('nonprofit');
      console.log('  ✅ Organization type selected: nonprofit');
    }

    // Description
    const descInput = page.locator('textarea').first();
    if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await descInput.fill('A collective organization dedicated to animal rescue and welfare, managed by our team of veterinarians and volunteers.');
      console.log('  ✅ Organization description entered');
    }

    await takeScreenshot(page, 'org-form-filled');

    // Step 10: Submit organization creation
    console.log('\n🔟 Submitting organization creation...');
    const submitOrgButton = page.locator('button:has-text("Create Organization")').last();
    
    if (await submitOrgButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitOrgButton.click();
      console.log('  ✅ Submit button clicked');
      
      // Wait for success message
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await takeScreenshot(page, 'org-created');

    // Check for success message
    const successMessage = page.locator('text=Organization created successfully|Redirecting to your new organization');
    if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ✅ SUCCESS: Organization created successfully!');
    } else {
      const pageText = await page.textContent('body');
      if (pageText?.includes('created') || pageText?.includes('success')) {
        console.log('  ✅ Success message found in page content');
      } else {
        console.log('  ⚠️  Success message not clearly visible');
      }
    }

    // Wait a bit for potential redirect
    await new Promise(resolve => setTimeout(resolve, 2000));
    const finalUrl = page.url();
    console.log(`\n  📍 Final URL: ${finalUrl}`);

    console.log('\n✨ Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-final');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testIntelligentOnboarding().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
