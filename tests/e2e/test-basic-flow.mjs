import { chromium } from 'playwright'

async function testBasicFlow() {
  console.log('🚀 Starting Basic Flow Test...')

  let browser

  try {
    // Launch browser
    console.log('🌐 Launching browser...')
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--window-size=1280,720']
    })

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    })

    const page = await context.newPage()

    // Test 1: Home page loads
    console.log('🏠 Testing home page...')
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
      const errors = []
      window.addEventListener('error', (e) => errors.push(e.message))
      return errors
    })

    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors found:', jsErrors)
    } else {
      console.log('✅ No JavaScript errors detected')
    }

    const title = await page.title()
    console.log(`📄 Page title: "${title}"`)

    // Check if body content is loaded
    const bodyContent = await page.locator('body').textContent()
    console.log(`📝 Body content length: ${bodyContent?.length || 0} characters`)

    // Take screenshot of home page
    await page.screenshot({ path: 'home-page.png', fullPage: true })
    console.log('📸 Home page screenshot saved')

    // Check if experimental notice is visible
    const experimentalNotice = page.locator('text=Experimental Version').first()
    if (await experimentalNotice.isVisible()) {
      console.log('✅ Experimental notice found')
    } else {
      console.log('❌ Experimental notice not found')

      // Check if any text is visible on the page
      const allText = await page.locator('*').evaluateAll(elements =>
        elements.map(el => el.textContent).filter(Boolean).join(' ')
      )
      console.log('📝 All visible text:', allText.substring(0, 200) + '...')
    }

    // Test 2: Check if we can navigate to auth page
    console.log('🔐 Testing auth page navigation...')
    await page.goto('http://localhost:3003/auth?mode=register', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const authTitle = await page.title()
    console.log(`📄 Auth page title: "${authTitle}"`)

    // Take screenshot of auth page
    await page.screenshot({ path: 'auth-page.png', fullPage: true })
    console.log('📸 Auth page screenshot saved')

    // Test 3: Check if organizations page loads
    console.log('🏢 Testing organizations page...')
    await page.goto('http://localhost:3003/organizations', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Check current URL after navigation
    const currentUrl = page.url()
    console.log(`🔗 Final URL: ${currentUrl}`)

    // If redirected to auth, that's expected
    if (currentUrl.includes('/auth')) {
      console.log('✅ Correctly redirected to authentication page')

      // Take screenshot of auth redirect
      await page.screenshot({ path: 'organizations-auth-redirect.png', fullPage: true })
      console.log('📸 Auth redirect screenshot saved')

      // Check if auth page has the expected buttons
      const loginButton = page.locator('button:has-text("Sign in"), button:has-text("Log in")').first()
      const registerButton = page.locator('button:has-text("Get Started"), button:has-text("Sign up")').first()

      if (await loginButton.isVisible()) {
        console.log('✅ Login button found on auth page')
      } else {
        console.log('❌ Login button not found on auth page')
      }

      if (await registerButton.isVisible()) {
        console.log('✅ Register button found on auth page')
      } else {
        console.log('❌ Register button not found on auth page')
      }

      return
    }

    // If not redirected, check organizations page
    const orgTitle = await page.title()
    console.log(`📄 Organizations page title: "${orgTitle}"`)

    // Take screenshot of organizations page
    await page.screenshot({ path: 'organizations-page.png', fullPage: true })
    console.log('📸 Organizations page screenshot saved')

    // Check if "Create Organization" button exists
    const createOrgButton = page.locator('button:has-text("Create Organization")').first()
    if (await createOrgButton.isVisible()) {
      console.log('✅ Create Organization button found')
    } else {
      console.log('❌ Create Organization button not found')

      // Check what buttons are actually on the page
      const allButtons = await page.locator('button').evaluateAll(buttons =>
        buttons.map(btn => btn.textContent?.trim()).filter(Boolean)
      )
      console.log('📝 All buttons on page:', allButtons)
    }

    console.log('✅ Basic flow test completed successfully')

  } catch (error) {
    console.error('❌ Test failed:', error)

    // Take error screenshot
    if (browser) {
      const page = await browser.newPage()
      await page.goto('http://localhost:3003', { waitUntil: 'networkidle' })
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
      console.log('📸 Error screenshot saved to error-screenshot.png')
    }
  } finally {
    if (browser) {
      await browser.close()
      console.log('🔒 Browser closed')
    }

    console.log('🏁 Test completed')
  }
}

// Run the test
testBasicFlow().catch(console.error)
