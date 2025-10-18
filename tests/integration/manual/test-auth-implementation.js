/**
 * Puppeteer Test for Auth Implementation
 *
 * Tests the fixed auth system to verify:
 * 1. Server starts without errors
 * 2. Pages load correctly
 * 3. No console errors from missing imports
 * 4. Auth components render
 * 5. Environment validation works
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 30000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBasicPageLoad() {
  console.log('\n🧪 Test 1: Basic Page Load');
  console.log('═══════════════════════════════════════');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Collect console messages
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });

      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to home page
    console.log('📄 Loading home page...');
    const response = await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });

    if (response.status() !== 200) {
      throw new Error(`Page returned status ${response.status()}`);
    }

    console.log('✅ Home page loaded successfully (200 OK)');

    // Wait for React to hydrate
    await sleep(2000);

    // Check for critical errors
    const criticalErrors = errors.filter(err =>
      err.includes('ReferenceError') ||
      err.includes('is not defined') ||
      err.includes('Cannot read') ||
      err.includes('logger') ||
      err.includes('SupabaseClient')
    );

    if (criticalErrors.length > 0) {
      console.log('❌ Critical errors found:');
      criticalErrors.forEach(err => console.log(`   - ${err}`));
      return false;
    }

    console.log('✅ No critical JavaScript errors');

    // Check if AuthProvider is in the DOM (it won't have visible elements but should load)
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);

    // Check for basic page structure
    if (!bodyHTML || bodyHTML.length < 100) {
      console.log('❌ Page appears to be empty');
      return false;
    }

    console.log('✅ Page content rendered');

    return true;
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testAuthPage() {
  console.log('\n🧪 Test 2: Auth Page Load');
  console.log('═══════════════════════════════════════');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to auth page
    console.log('📄 Loading /auth page...');
    const response = await page.goto(`${BASE_URL}/auth`, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });

    if (response.status() !== 200) {
      throw new Error(`Auth page returned status ${response.status()}`);
    }

    console.log('✅ Auth page loaded successfully (200 OK)');

    // Wait for page to render
    await sleep(2000);

    // Check for auth form elements
    const hasEmailInput = await page.$('input[type="email"]');
    const hasPasswordInput = await page.$('input[type="password"]');

    if (!hasEmailInput) {
      console.log('❌ Email input not found on auth page');
      return false;
    }

    if (!hasPasswordInput) {
      console.log('❌ Password input not found on auth page');
      return false;
    }

    console.log('✅ Auth form elements present');

    // Check for critical errors
    const criticalErrors = errors.filter(err =>
      err.includes('ReferenceError') ||
      err.includes('is not defined') ||
      err.includes('validateOAuthProvider')
    );

    if (criticalErrors.length > 0) {
      console.log('❌ Critical errors on auth page:');
      criticalErrors.forEach(err => console.log(`   - ${err}`));
      return false;
    }

    console.log('✅ No critical errors on auth page');

    return true;
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testMiddleware() {
  console.log('\n🧪 Test 3: Middleware (Protected Route)');
  console.log('═══════════════════════════════════════');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Try to access protected route without auth
    console.log('📄 Accessing /dashboard (protected route)...');
    const response = await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });

    await sleep(1000);

    const currentUrl = page.url();
    console.log(`📍 Redirected to: ${currentUrl}`);

    // Should redirect to /auth
    if (currentUrl.includes('/auth')) {
      console.log('✅ Middleware correctly redirected to auth page');

      // Check that redirect params are present
      if (currentUrl.includes('from=') || currentUrl.includes('mode=login')) {
        console.log('✅ Redirect parameters preserved');
      }

      return true;
    } else {
      console.log('❌ Middleware did not redirect to auth page');
      console.log(`   Expected: /auth, Got: ${currentUrl}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function testSupabaseClient() {
  console.log('\n🧪 Test 4: Supabase Client Initialization');
  console.log('═══════════════════════════════════════');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    const errors = [];
    const logs = [];

    page.on('console', msg => {
      logs.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Load page and check for Supabase errors
    console.log('📄 Loading page to test Supabase client...');
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });

    await sleep(2000);

    // Check for Supabase configuration errors
    const supabaseErrors = errors.filter(err =>
      err.toLowerCase().includes('supabase') &&
      (err.includes('Missing required') ||
       err.includes('Invalid') ||
       err.includes('not defined'))
    );

    if (supabaseErrors.length > 0) {
      console.log('❌ Supabase configuration errors:');
      supabaseErrors.forEach(err => console.log(`   - ${err}`));
      return false;
    }

    console.log('✅ Supabase client initialized without errors');

    // Check for successful connection test log (only in dev)
    const connectionLogs = logs.filter(log =>
      log.text.includes('Supabase connection test')
    );

    if (connectionLogs.length > 0) {
      console.log('✅ Supabase connection test detected');
    }

    return true;
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Auth Implementation Test Suite              ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n🎯 Testing against: ${BASE_URL}`);
  console.log('⏱️  Timeout: 30s per test\n');

  const results = {
    basicPageLoad: false,
    authPage: false,
    middleware: false,
    supabaseClient: false
  };

  try {
    results.basicPageLoad = await testBasicPageLoad();
    results.authPage = await testAuthPage();
    results.middleware = await testMiddleware();
    results.supabaseClient = await testSupabaseClient();

    // Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              TEST RESULTS SUMMARY              ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    const allPassed = Object.values(results).every(r => r === true);
    const passedCount = Object.values(results).filter(r => r === true).length;
    const totalCount = Object.values(results).length;

    console.log(`✅ Basic Page Load:           ${results.basicPageLoad ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Auth Page:                 ${results.authPage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Middleware Protection:     ${results.middleware ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Supabase Initialization:   ${results.supabaseClient ? 'PASS' : 'FAIL'}`);

    console.log(`\n📊 Overall: ${passedCount}/${totalCount} tests passed\n`);

    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Auth implementation is working.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Review the errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
