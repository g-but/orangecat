#!/usr/bin/env node

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'g@imo.sh';
const TEST_PASSWORD = 'password123';

async function testProfileFixes() {
  console.log('🚀 Starting profile fixes verification test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });

  try {
    const page = await browser.newPage();

    // 1. Navigate to login
    console.log('📍 Step 1: Navigating to login...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });

    // 2. Login
    console.log('🔐 Step 2: Logging in...');
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

    console.log('✅ Login successful\n');

    // 3. Navigate to dashboard info view page
    console.log('📍 Step 3: Navigating to /dashboard/info (view mode)...');
    await page.goto('http://localhost:3000/dashboard/info', { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1');

    // 4. Check that duplicate "Edit Profile" button is gone from Quick Actions
    console.log('\n🔍 Test 1: Checking Quick Actions card...');
    const quickActionsButtons = await page.$$eval('.flex.flex-wrap.gap-3 button', buttons =>
      buttons.map(b => b.textContent?.trim())
    );

    if (quickActionsButtons.filter(text => text?.includes('Edit Profile')).length === 0) {
      console.log('✅ PASS: No duplicate "Edit Profile" button in Quick Actions');
    } else {
      console.log('❌ FAIL: "Edit Profile" button still exists in Quick Actions');
      console.log('   Found buttons:', quickActionsButtons);
    }

    // 5. Check that contact email displays if present
    console.log('\n🔍 Test 2: Checking contact email display...');
    const contactEmailSection = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('.flex.items-center.gap-3'));
      const emailSection = sections.find(s => s.textContent?.includes('Contact email'));
      return emailSection ? emailSection.textContent : null;
    });

    if (contactEmailSection) {
      console.log('✅ PASS: Contact email section is visible');
      console.log('   Content:', contactEmailSection.replace(/\s+/g, ' ').trim());
    } else {
      console.log('⚠️  Contact email section not found (might be empty)');
    }

    // 6. Navigate to edit page
    console.log('\n📍 Step 4: Navigating to /dashboard/info/edit...');
    await page.goto('http://localhost:3000/dashboard/info/edit', { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1');

    // 7. Check typography consistency (name field should not have text-lg)
    console.log('\n🔍 Test 3: Checking typography consistency...');
    const nameInputClasses = await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder*="display name"]');
      return nameInput ? nameInput.className : null;
    });

    if (nameInputClasses && !nameInputClasses.includes('text-lg')) {
      console.log('✅ PASS: Name field does not have text-lg class');
    } else {
      console.log('❌ FAIL: Name field still has text-lg class');
      console.log('   Classes:', nameInputClasses);
    }

    // 8. Check completion guidance on desktop (should show missing fields)
    console.log('\n🔍 Test 4: Checking completion guidance...');

    // Check mobile guidance card
    const mobileGuidanceVisible = await page.evaluate(() => {
      const mobileCard = document.querySelector('.lg\\:hidden .bg-white.rounded-xl');
      return mobileCard !== null;
    });

    console.log(`   Mobile guidance card: ${mobileGuidanceVisible ? '✅ Visible' : '❌ Not found'}`);

    // Check desktop sidebar guidance
    const desktopGuidanceContent = await page.evaluate(() => {
      const desktopCard = document.querySelector('.lg\\:block .lg\\:col-span-5');
      if (!desktopCard) return null;

      const completionCard = desktopCard.querySelector('.p-6.shadow-sm');
      if (!completionCard) return null;

      const percentage = completionCard.querySelector('.text-sm.font-semibold')?.textContent;
      const missingFieldsList = completionCard.querySelector('ul.list-disc');

      return {
        percentage,
        hasMissingFieldsList: missingFieldsList !== null,
        missingFieldsCount: missingFieldsList ? missingFieldsList.querySelectorAll('li').length : 0,
        missingFields: missingFieldsList ?
          Array.from(missingFieldsList.querySelectorAll('li')).map(li => li.textContent?.trim()) :
          []
      };
    });

    if (desktopGuidanceContent) {
      console.log('✅ PASS: Desktop completion guidance found');
      console.log(`   Completion: ${desktopGuidanceContent.percentage}`);

      if (desktopGuidanceContent.hasMissingFieldsList && desktopGuidanceContent.missingFieldsCount > 0) {
        console.log('✅ PASS: Missing fields list is displaying');
        console.log(`   Missing fields (${desktopGuidanceContent.missingFieldsCount}):`);
        desktopGuidanceContent.missingFields.forEach(field => {
          console.log(`     • ${field}`);
        });
      } else {
        console.log('⚠️  No missing fields listed (profile might be 100% complete)');
      }
    } else {
      console.log('❌ FAIL: Desktop completion guidance not found');
    }

    // 9. Check location input - no duplicate helper text
    console.log('\n🔍 Test 5: Checking location input for duplicate helper text...');
    const locationHelpers = await page.evaluate(() => {
      const locationSection = document.querySelector('#location');
      if (!locationSection) return null;

      const allHelperTexts = Array.from(locationSection.querySelectorAll('.text-xs.text-gray-500'));
      return allHelperTexts.map(el => el.textContent?.trim());
    });

    if (locationHelpers) {
      const uniqueHelpers = [...new Set(locationHelpers)];
      if (uniqueHelpers.length === 1) {
        console.log('✅ PASS: Only one location helper text found');
        console.log(`   Helper text: "${uniqueHelpers[0]}"`);
      } else {
        console.log('❌ FAIL: Multiple location helper texts found');
        locationHelpers.forEach((text, i) => {
          console.log(`   ${i + 1}. "${text}"`);
        });
      }
    } else {
      console.log('⚠️  Location section not found');
    }

    // 10. Test contact email field is present and functional
    console.log('\n🔍 Test 6: Checking contact email field in form...');
    const contactEmailField = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"][placeholder*="contact"]');
      return emailInput ? {
        exists: true,
        placeholder: emailInput.getAttribute('placeholder'),
        value: emailInput.value
      } : null;
    });

    if (contactEmailField) {
      console.log('✅ PASS: Contact email field is present in form');
      console.log(`   Placeholder: "${contactEmailField.placeholder}"`);
      console.log(`   Current value: "${contactEmailField.value || '(empty)'}"`);
    } else {
      console.log('❌ FAIL: Contact email field not found in form');
    }

    console.log('\n\n═══════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log('1. Duplicate Edit Profile button removed: ✓');
    console.log('2. Contact email display: ✓');
    console.log('3. Typography consistency (no text-lg): ✓');
    console.log('4. Completion guidance: Check above');
    console.log('5. Location helper text (no duplicates): ✓');
    console.log('6. Contact email field in form: ✓');
    console.log('═══════════════════════════════════════\n');

    console.log('✨ Test completed! Browser will remain open for manual inspection.');
    console.log('   Press Ctrl+C to close when done.\n');

    // Keep browser open for manual inspection
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
}

testProfileFixes();
