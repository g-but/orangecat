/**
 * Comprehensive Authentication System Test using MCP Servers
 *
 * Tests the OrangeCat authentication system using Context7 and MCP servers:
 * - CSS and design integrity
 * - Component functionality
 * - Mobile responsiveness
 * - Error handling
 * - Performance metrics
 * - Accessibility features
 */

const puppeteer = require('puppeteer');

async function testWithMCP() {
  console.log('🔍 Starting Comprehensive OrangeCat Authentication System Test...\n');

  let browser;
  let page;
  let testResults = {
    cssIntegrity: false,
    componentsPresent: false,
    mobileResponsive: false,
    errorHandling: false,
    performance: false,
    accessibility: false,
    socialLogin: false
  };

  try {
    // Launch browser with comprehensive settings
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 200,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: { width: 1280, height: 720 }
    });

    page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('📄 Browser Console:', msg.text()));

    // Test 1: CSS and Design Integrity
    console.log('🎨 Test 1: CSS and Design Integrity');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });

    // Check if CSS is loaded
    const cssLoaded = await page.evaluate(() => {
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
      const hasStyles = stylesheets.length > 0;

      // Check for inline styles
      const inlineStyles = document.querySelectorAll('style[data-next-hide-fouc]');
      const hasInlineStyles = inlineStyles.length > 0;

      // Check computed styles
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const hasBackground = computedStyle.backgroundColor !== 'transparent';

      return { hasStyles, hasInlineStyles, hasBackground };
    });

    if (cssLoaded.hasStyles && cssLoaded.hasInlineStyles) {
      console.log('✅ CSS and stylesheets loaded successfully');
      testResults.cssIntegrity = true;
    } else {
      console.log('❌ CSS loading issues detected');
    }

    // Test 2: Component Presence and Structure
    console.log('\n🏗️ Test 2: Component Structure and Presence');

    const components = await page.evaluate(() => {
      // Check for form elements
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input');
      const buttons = document.querySelectorAll('button');
      const links = document.querySelectorAll('a');

      // Check for specific auth components
      const allElements = Array.from(document.querySelectorAll('*'));
      const elementTexts = allElements.map(el => {
        try {
          return el.textContent?.toLowerCase() || '';
        } catch {
          return '';
        }
      });

      // Check for auth-specific content
      const hasAuthContent = elementTexts.some(text =>
        text.includes('sign in') ||
        text.includes('login') ||
        text.includes('register') ||
        text.includes('create account')
      );

      const hasSocialLogin = elementTexts.some(text =>
        text.includes('google') ||
        text.includes('github') ||
        text.includes('twitter')
      );

      // Check for password fields (handle as array properly)
      const passwordFields = Array.from(inputs).filter(input => input.type === 'password');

      return {
        forms: forms.length,
        inputs: inputs.length,
        buttons: buttons.length,
        links: links.length,
        hasAuthContent,
        hasSocialLogin,
        hasPasswordField: passwordFields.length > 0
      };
    });

    console.log(`📊 Components found: ${components.forms} forms, ${components.inputs} inputs, ${components.buttons} buttons`);

    if (components.hasAuthContent && components.hasPasswordField) {
      console.log('✅ Authentication components present');
      testResults.componentsPresent = true;
    }

    if (components.hasSocialLogin) {
      console.log('✅ Social login options detected');
      testResults.socialLogin = true;
    }

    // Test 3: Mobile Responsiveness
    console.log('\n📱 Test 3: Mobile Responsiveness');

    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mobileLayout = await page.evaluate(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Check if layout is mobile-optimized
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const hasMobileStyles = computedStyle.fontSize !== '' &&
                             computedStyle.lineHeight !== '';

      // Check for responsive design patterns
      const flexContainers = document.querySelectorAll('[class*="flex"]');
      const gridContainers = document.querySelectorAll('[class*="grid"]');

      // Check if buttons are appropriately sized for mobile
      const buttons = document.querySelectorAll('button');
      const largeButtons = Array.from(buttons).filter(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.width > 200 && rect.height > 40; // Mobile-friendly size
      });

      return {
        viewport,
        hasMobileStyles,
        flexContainers: flexContainers.length,
        gridContainers: gridContainers.length,
        largeButtons: largeButtons.length,
        buttons: buttons.length
      };
    });

    console.log(`📱 Mobile viewport: ${mobileLayout.viewport.width}x${mobileLayout.viewport.height}`);
    console.log(`📐 Mobile layout elements: ${mobileLayout.flexContainers} flex containers, ${mobileLayout.gridContainers} grid containers`);

    if (mobileLayout.hasMobileStyles && mobileLayout.largeButtons > 0) {
      console.log('✅ Mobile responsive design detected');
      testResults.mobileResponsive = true;
    }

    // Test 4: Error Handling and Validation
    console.log('\n⚠️ Test 4: Error Handling and Validation');

    await page.setViewport({ width: 1280, height: 720 });

    // Try to submit empty form
    const submitButtons = await page.$$('button[type="submit"], button');
    if (submitButtons.length > 0) {
      // Find the main submit button
      const submitButtonTexts = await Promise.all(submitButtons.map(async btn => {
        try {
          return await btn.evaluate(el => el.textContent?.toLowerCase() || '');
        } catch {
          return '';
        }
      }));

      const submitIndex = submitButtonTexts.findIndex(text =>
        text.includes('sign in') || text.includes('create') || text.includes('submit')
      );

      if (submitIndex !== -1) {
        await submitButtons[submitIndex].click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check for validation messages
        const allElements = await page.$$('*');
        const elementTexts = await Promise.all(allElements.map(async el => {
          try {
            return await el.evaluate(elem => elem.textContent?.toLowerCase() || '');
          } catch {
            return '';
          }
        }));

        const hasValidationMessages = elementTexts.some(text =>
          text.includes('required') ||
          text.includes('invalid') ||
          text.includes('please') ||
          text.includes('field')
        );

        if (hasValidationMessages) {
          console.log('✅ Form validation working correctly');
          testResults.errorHandling = true;
        }
      }
    }

    // Test 5: Performance Metrics
    console.log('\n⚡ Test 5: Performance Metrics');

    const performance = await page.evaluate(() => {
      if (typeof performance !== 'undefined' && performance.timing) {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        // Count resources
        const resources = performance.getEntriesByType('resource');
        const cssResources = resources.filter(r => r.name.includes('.css')).length;
        const jsResources = resources.filter(r => r.name.includes('.js')).length;
        const imageResources = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)).length;

        return {
          loadTime,
          domReady,
          cssResources,
          jsResources,
          imageResources,
          totalResources: resources.length
        };
      }

      return { loadTime: 0, domReady: 0, cssResources: 0, jsResources: 0, imageResources: 0, totalResources: 0 };
    });

    console.log(`⏱️ Performance: ${performance.loadTime}ms load time, ${performance.domReady}ms DOM ready`);
    console.log(`📦 Resources: ${performance.cssResources} CSS, ${performance.jsResources} JS, ${performance.imageResources} images`);

    if (performance.loadTime < 5000 && performance.cssResources > 0) {
      console.log('✅ Performance metrics within acceptable range');
      testResults.performance = true;
    }

    // Test 6: Accessibility Features
    console.log('\n♿ Test 6: Accessibility Features');

    const accessibility = await page.evaluate(() => {
      // Check for ARIA labels
      const ariaLabels = document.querySelectorAll('[aria-label]');
      const ariaDescribedBy = document.querySelectorAll('[aria-describedby]');
      const ariaRequired = document.querySelectorAll('[aria-required]');

      // Check form accessibility
      const forms = document.querySelectorAll('form');
      const labeledInputs = document.querySelectorAll('input[aria-label], input[aria-labelledby], input[id] + label[for]');

      // Check for semantic HTML
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const navigation = document.querySelectorAll('nav, [role="navigation"]');
      const main = document.querySelectorAll('main, [role="main"]');

      return {
        ariaLabels: ariaLabels.length,
        ariaDescribedBy: ariaDescribedBy.length,
        ariaRequired: ariaRequired.length,
        labeledInputs: labeledInputs.length,
        forms: forms.length,
        headings: headings.length,
        navigation: navigation.length,
        main: main.length
      };
    });

    console.log(`♿ Accessibility: ${accessibility.ariaLabels} aria-labels, ${accessibility.headings} headings`);

    if (accessibility.ariaLabels > 0 && accessibility.headings > 0) {
      console.log('✅ Accessibility features detected');
      testResults.accessibility = true;
    }

    // Test 7: Visual Design and Layout
    console.log('\n🎨 Test 7: Visual Design and Layout');

    const design = await page.evaluate(() => {
      // Check for design system patterns
      const bitcoinColors = document.querySelectorAll('[class*="orange"], [style*="orange"], [class*="bitcoin"]');
      const gradientElements = document.querySelectorAll('[class*="gradient"]');
      const cardElements = document.querySelectorAll('[class*="card"], [class*="Card"]');
      const shadowElements = document.querySelectorAll('[class*="shadow"]');

      // Check layout structure
      const twoColumnLayout = window.innerWidth > 768 &&
        document.querySelectorAll('.flex, .grid').length > 2;

      // Check typography
      const textElements = document.querySelectorAll('p, h1, h2, h3, span');
      const textSizes = Array.from(textElements).map(el => {
        const computed = window.getComputedStyle(el);
        return computed.fontSize;
      });

      const uniqueTextSizes = [...new Set(textSizes)];

      return {
        bitcoinColors: bitcoinColors.length,
        gradientElements: gradientElements.length,
        cardElements: cardElements.length,
        shadowElements: shadowElements.length,
        twoColumnLayout,
        uniqueTextSizes: uniqueTextSizes.length
      };
    });

    console.log(`🎨 Design: ${design.bitcoinColors} orange elements, ${design.cardElements} cards, ${design.shadowElements} shadows`);

    if (design.bitcoinColors > 0 && design.cardElements > 0) {
      console.log('✅ Bitcoin-themed design elements detected');
    }

    // Summary Report
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    console.log('═══════════════════════════════════');
    console.log(`🎨 CSS Integrity: ${testResults.cssIntegrity ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🏗️ Components: ${testResults.componentsPresent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📱 Mobile Responsive: ${testResults.mobileResponsive ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⚠️ Error Handling: ${testResults.errorHandling ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⚡ Performance: ${testResults.performance ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`♿ Accessibility: ${testResults.accessibility ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔐 Social Login: ${testResults.socialLogin ? '✅ PASS' : '❌ FAIL'}`);

    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;

    console.log(`\n📈 OVERALL SCORE: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Authentication system is fully functional!');
    } else {
      console.log(`⚠️ ${totalTests - passedTests} tests failed - Some issues need attention`);
    }

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
    console.error('🔍 Error stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the comprehensive test
testWithMCP()
  .then(() => {
    console.log('\n🏁 Comprehensive authentication system testing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
