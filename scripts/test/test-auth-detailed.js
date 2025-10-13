#!/usr/bin/env node

/**
 * Detailed Authentication Flow Investigation
 */

const { chromium } = require('playwright');

async function runDetailedAuthTest() {
  console.log('🔍 Running Detailed Authentication Investigation...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to homepage
    console.log('\n📍 Analyzing Homepage Content');
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading to complete
    try {
      await page.waitForSelector('text=Loading', { state: 'detached', timeout: 5000 });
    } catch (e) {
      console.log('⏭️ No loading spinner detected');
    }
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page Title:', title || 'No title');
    
    // Look for ANY authentication-related buttons/links
    const authTexts = ['Sign In', 'Login', 'Log In', 'Sign Up', 'Register', 'Auth', 'Account'];
    console.log('\n🔍 Searching for authentication buttons...');
    
    for (const text of authTexts) {
      const count = await page.locator(`text=${text}`).count();
      console.log(`  "${text}": ${count > 0 ? `✅ Found (${count})` : '❌ Not found'}`);
    }
    
    // Look for buttons with common auth attributes
    const authButtonSelectors = [
      'button:has-text("Sign")',
      'a:has-text("Sign")',
      'button:has-text("Login")', 
      'a:has-text("Login")',
      '[href*="auth"]',
      '[href*="login"]',
      '[href*="signin"]'
    ];
    
    console.log('\n🔗 Searching by selectors...');
    for (const selector of authButtonSelectors) {
      try {
        const count = await page.locator(selector).count();
        console.log(`  ${selector}: ${count > 0 ? `✅ Found (${count})` : '❌ Not found'}`);
      } catch (e) {
        console.log(`  ${selector}: ❌ Invalid selector`);
      }
    }
    
    // Get all visible text to understand what's on the page
    const bodyText = await page.locator('body').textContent();
    const authKeywords = bodyText.match(/(sign|login|auth|account|register|join)/gi) || [];
    console.log('\n📝 Auth-related keywords found:', authKeywords.length > 0 ? authKeywords : 'None');
    
    // Navigate directly to /auth page
    console.log('\n🔐 Testing Direct Auth Page Navigation');
    await page.goto('http://localhost:3003/auth');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to fully load
    try {
      await page.waitForSelector('text=Loading', { state: 'detached', timeout: 5000 });
    } catch (e) {
      console.log('⏭️ No loading spinner on auth page');
    }
    
    // Get auth page title
    const authTitle = await page.title();
    console.log('📄 Auth Page Title:', authTitle || 'No title');
    
    // Look for form elements with various selectors
    const formSelectors = [
      'input[type="email"]',
      'input[type="password"]', 
      'input[name*="email"]',
      'input[name*="password"]',
      'input[placeholder*="email"]',
      'input[placeholder*="password"]',
      'button[type="submit"]',
      'form',
      'input',
      'button'
    ];
    
    console.log('\n📝 Form Elements Analysis:');
    for (const selector of formSelectors) {
      const count = await page.locator(selector).count();
      console.log(`  ${selector}: ${count > 0 ? `✅ Found (${count})` : '❌ Not found'}`);
    }
    
    // Check if there are any forms at all
    const allInputs = await page.locator('input').count();
    const allButtons = await page.locator('button').count(); 
    const allForms = await page.locator('form').count();
    
    console.log('\n📊 Element Counts:');
    console.log(`  Total inputs: ${allInputs}`);
    console.log(`  Total buttons: ${allButtons}`);
    console.log(`  Total forms: ${allForms}`);
    
    // Get auth page content to see what's actually there
    const authBodyText = await page.locator('body').textContent();
    const isEmptyOrLoading = authBodyText.includes('Loading') || authBodyText.trim().length < 100;
    console.log('\n📄 Auth Page State:', isEmptyOrLoading ? '⏳ Still loading or empty' : '✅ Content loaded');
    
    if (!isEmptyOrLoading) {
      console.log('📝 Auth page content preview:', authBodyText.substring(0, 200) + '...');
    }
    
    // Take final screenshots
    await page.screenshot({ path: 'test-results/detailed-homepage.png', fullPage: true });
    await page.screenshot({ path: 'test-results/detailed-auth-page.png', fullPage: true });
    
    console.log('\n✅ Detailed Investigation Complete!');
    console.log('📸 Screenshots saved: detailed-homepage.png, detailed-auth-page.png');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await browser.close();
  }
}

runDetailedAuthTest().catch(console.error); 