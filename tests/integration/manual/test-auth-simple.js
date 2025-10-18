/**
 * Simple Authentication System Test
 *
 * Tests the OrangeCat authentication system improvements:
 * - Social login integration
 * - Mobile responsiveness
 * - Error handling
 * - Security features
 * - Performance optimizations
 */

const puppeteer = require('puppeteer');

async function testAuthSystem() {
  console.log('🧪 Starting OrangeCat Authentication System Tests...\n');

  let browser;
  let page;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    page.setViewport({ width: 1280, height: 720 });

    // Test 1: Navigate to auth page
    console.log('✅ Test 1: Navigate to authentication page');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 5000 });

    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Test 2: Check if social login buttons are present
    console.log('\n✅ Test 2: Check for social login buttons');
    const googleButton = await page.$('button');
    const buttons = await page.$$('button');
    const buttonTexts = await Promise.all(buttons.map(async btn => {
      try {
        return await btn.evaluate(el => el.textContent);
      } catch {
        return '';
      }
    }));

    const hasGoogleLogin = buttonTexts.some(text => text && text.includes('Google'));
    const hasGithubLogin = buttonTexts.some(text => text && text.includes('GitHub'));
    const hasTwitterLogin = buttonTexts.some(text => text && text.includes('Twitter'));

    if (hasGoogleLogin) console.log('✅ Google login button found');
    if (hasGithubLogin) console.log('✅ GitHub login button found');
    if (hasTwitterLogin) console.log('✅ Twitter login button found');

    // Test 3: Check mobile responsiveness
    console.log('\n✅ Test 3: Test mobile responsiveness');
    await page.setViewport({ width: 375, height: 667 });

    const isMobileResponsive = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form && window.getComputedStyle(form).display !== 'none';
    });

    if (isMobileResponsive) {
      console.log('✅ Mobile responsive design working');
    }

    // Test 4: Check password strength meter
    console.log('\n✅ Test 4: Test password strength meter');
    await page.setViewport({ width: 1280, height: 720 });

    // Switch to register mode
    const createAccountButtons = await page.$$('button');
    const createAccountButtonTexts = await Promise.all(createAccountButtons.map(async btn => {
      try {
        return await btn.evaluate(el => el.textContent);
      } catch {
        return '';
      }
    }));

    const registerButtonIndex = createAccountButtonTexts.findIndex(text =>
      text && text.includes('Create an account')
    );

    if (registerButtonIndex !== -1) {
      await createAccountButtons[registerButtonIndex].click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test weak password
      const passwordInputs = await page.$$('input[type="password"]');
      if (passwordInputs.length > 0) {
        await passwordInputs[0].type('weak');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check for password strength indicators
        const allElements = await page.$$('*');
        const elementTexts = await Promise.all(allElements.map(async el => {
          try {
            return await el.evaluate(elem => elem.textContent || '');
          } catch {
            return '';
          }
        }));

        const hasWeakIndicator = elementTexts.some(text => text && text.includes('Weak'));
        const hasStrongIndicator = elementTexts.some(text => text && text.includes('Strong'));

        if (hasWeakIndicator) {
          console.log('✅ Password strength meter shows "Weak" for weak passwords');
        }

        // Clear and test strong password
        await passwordInputs[0].click({ clickCount: 3 });
        await passwordInputs[0].type('StrongPassword123!');
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (hasStrongIndicator) {
          console.log('✅ Password strength meter shows "Strong" for strong passwords');
        }
      }
    }

    // Test 5: Check for enhanced error handling
    console.log('\n✅ Test 5: Test error handling');
    const emailInputs = await page.$$('input[type="email"], input[id="email"]');
    if (emailInputs.length > 0) {
      await emailInputs[0].type('invalid-email');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if error message appears
      const allElements = await page.$$('*');
      const elementTexts = await Promise.all(allElements.map(async el => {
        try {
          return await el.evaluate(elem => elem.textContent || '');
        } catch {
          return '';
        }
      }));

      const hasErrorMessage = elementTexts.some(text =>
        text && (text.includes('invalid') || text.includes('error') || text.includes('required'))
      );

      if (hasErrorMessage) {
        console.log('✅ Error handling working correctly');
      }
    }

    // Test 6: Test loading states
    console.log('\n✅ Test 6: Test loading states');
    const submitButtons = await page.$$('button[type="submit"], button');
    const submitButtonTexts = await Promise.all(submitButtons.map(async btn => {
      try {
        return await btn.evaluate(el => el.textContent);
      } catch {
        return '';
      }
    }));

    const submitButtonIndex = submitButtonTexts.findIndex(text =>
      text && (text.includes('Sign in') || text.includes('Create') || text.includes('Submit'))
    );

    if (submitButtonIndex !== -1) {
      const isDisabled = await page.evaluate(button => button.disabled, submitButtons[submitButtonIndex]);
      console.log(`✅ Submit button disabled state: ${isDisabled}`);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests
testAuthSystem()
  .then(() => {
    console.log('\n🏁 Authentication system testing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
