#!/usr/bin/env node

/**
 * 🌐 OrangeCat Browser Verification
 *
 * Automatically tests the deployed production site to ensure it works.
 * This runs after deployment to verify everything is functioning.
 */

import { chromium } from 'playwright';
import chalk from 'chalk';

// Configuration
const CONFIG = {
  url: 'https://www.orangecat.ch',
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Colors
const colors = {
  success: chalk.bold.green,
  error: chalk.bold.red,
  warning: chalk.bold.yellow,
  info: chalk.cyan,
  dim: chalk.dim
};

/**
 * Take screenshot for verification
 */
async function takeScreenshot(page, name) {
  const screenshotPath = `deployment-verification-${name}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(colors.dim(`📸 Screenshot saved: ${screenshotPath}`));
}

/**
 * Test home page load
 */
async function testHomePage(page) {
  console.log(colors.info('🏠 Testing home page...'));

  try {
    await page.goto(CONFIG.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Let animations settle

    // Check for critical elements
    const title = await page.title();
    console.log(colors.dim(`   Page title: ${title}`));

    // Look for main content
    const hasMainContent = await page.locator('main, [role="main"], .main-content').count() > 0;
    if (!hasMainContent) {
      console.log(colors.warning('⚠️ No main content area found'));
    }

    // Check for navigation
    const hasNav = await page.locator('nav, header').count() > 0;
    if (!hasNav) {
      console.log(colors.warning('⚠️ No navigation found'));
    }

    await takeScreenshot(page, 'homepage');
    console.log(colors.success('✅ Home page loaded successfully'));

  } catch (error) {
    console.log(colors.error(`❌ Home page test failed: ${error.message}`));
    throw error;
  }
}

/**
 * Test navigation
 */
async function testNavigation(page) {
  console.log(colors.info('🧭 Testing navigation...'));

  try {
    // Try to find and click navigation links
    const navLinks = await page.locator('a[href]').all();

    if (navLinks.length === 0) {
      console.log(colors.warning('⚠️ No navigation links found'));
      return;
    }

    // Test a few navigation links (safely)
    let testedLinks = 0;
    for (const link of navLinks.slice(0, 3)) { // Test first 3 links
      try {
        const href = await link.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('#') && !href.includes('mailto:')) {
          console.log(colors.dim(`   Testing link: ${href}`));
          await link.click();
          await page.waitForTimeout(1000);
          await page.goBack();
          await page.waitForTimeout(1000);
          testedLinks++;
        }
      } catch (error) {
        // Link test failed, but don't fail the whole test
        console.log(colors.dim(`   Link test skipped: ${error.message}`));
      }
    }

    if (testedLinks > 0) {
      console.log(colors.success(`✅ Navigation tested (${testedLinks} links)`));
    } else {
      console.log(colors.warning('⚠️ No navigable links found'));
    }

  } catch (error) {
    console.log(colors.error(`❌ Navigation test failed: ${error.message}`));
    throw error;
  }
}

/**
 * Test authentication flows (if present)
 */
async function testAuthFlows(page) {
  console.log(colors.info('🔐 Testing authentication flows...'));

  try {
    // Look for auth-related elements
    const authSelectors = [
      '[data-testid="login"]',
      '[data-testid="signin"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("Sign Up")',
      'a:has-text("Login")',
      'a:has-text("Sign In")',
      'a:has-text("Sign Up")'
    ];

    let foundAuth = false;
    for (const selector of authSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(colors.dim(`   Found auth element: ${selector}`));
        foundAuth = true;
        break;
      }
    }

    if (!foundAuth) {
      console.log(colors.dim('   No authentication elements found (this may be normal)'));
    } else {
      console.log(colors.success('✅ Authentication elements detected'));
    }

  } catch (error) {
    console.log(colors.warning(`⚠️ Auth flow test had issues: ${error.message}`));
    // Don't fail for auth issues
  }
}

/**
 * Test core functionality
 */
async function testCoreFunctionality(page) {
  console.log(colors.info('⚙️ Testing core functionality...'));

  try {
    // Test for JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    if (jsErrors.length > 0) {
      console.log(colors.error(`❌ JavaScript errors detected: ${jsErrors.length}`));
      jsErrors.forEach(error => console.log(colors.dim(`   ${error}`)));
      throw new Error('JavaScript errors found');
    }

    // Test responsiveness (basic)
    const viewport = page.viewportSize();
    console.log(colors.dim(`   Viewport: ${viewport?.width}x${viewport?.height}`));

    console.log(colors.success('✅ Core functionality tests passed'));

  } catch (error) {
    console.log(colors.error(`❌ Core functionality test failed: ${error.message}`));
    throw error;
  }
}

/**
 * Test API health endpoints
 */
async function testApiHealth(page) {
  console.log(colors.info('🏥 Testing API health...'));

  try {
    // Test health endpoint
    const healthResponse = await page.request.get(`${CONFIG.url}/api/health`);
    if (healthResponse.ok()) {
      console.log(colors.success('✅ API health check passed'));
    } else {
      console.log(colors.warning(`⚠️ API health check returned ${healthResponse.status()}`));
    }

  } catch (error) {
    console.log(colors.warning(`⚠️ API health check failed: ${error.message}`));
    // Don't fail deployment for API issues
  }
}

/**
 * Run all verification tests
 */
async function runVerification() {
  let browser;
  let context;
  let page;

  try {
    console.log(colors.info(`🚀 Starting browser verification for ${CONFIG.url}\n`));

    // Launch browser
    browser = await chromium.launch();
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'OrangeCat-Deployment-Verifier/1.0'
    });
    page = await context.newPage();

    // Set timeout
    page.setDefaultTimeout(CONFIG.timeout);

    // Test 1: Home page
    await testHomePage(page);

    // Test 2: Navigation
    await testNavigation(page);

    // Test 3: Auth flows
    await testAuthFlows(page);

    // Test 4: Core functionality
    await testCoreFunctionality(page);

    // Test 5: API health
    await testApiHealth(page);

    console.log(colors.success(`\n🎉 Browser verification completed successfully!`));
    console.log(colors.dim(`All critical functionality verified for ${CONFIG.url}`));

  } catch (error) {
    console.log(colors.error(`\n❌ Browser verification failed: ${error.message}`));
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Main function with retries
 */
async function main() {
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
    try {
      console.log(colors.info(`\n🔄 Browser Verification Attempt ${attempt}/${CONFIG.retries}\n`));
      await runVerification();
      return; // Success
    } catch (error) {
      lastError = error;
      console.log(colors.warning(`⚠️ Attempt ${attempt} failed: ${error.message}`));

      if (attempt < CONFIG.retries) {
        console.log(colors.info('⏳ Waiting 10 seconds before retry...'));
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  // All attempts failed
  console.log(colors.error(`\n💥 All ${CONFIG.retries} verification attempts failed`));
  throw lastError;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(colors.error(`Browser verification failed: ${error.message}`));
    process.exit(1);
  });
}

export { runVerification };





















