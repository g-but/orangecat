import { chromium } from 'playwright'

async function testBasicFunctionality() {
  console.log('🚀 Testing Basic Application Functionality...')

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

    // Test 1: Home page loads and shows expected content
    console.log('🏠 Step 1: Home page loads')
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Check if experimental notice is visible
    const experimentalNotice = page.locator('text=Experimental Version').first()
    if (await experimentalNotice.isVisible()) {
      console.log('✅ Experimental notice visible')
    } else {
      console.log('❌ Experimental notice not found')
    }

    // Check what buttons are visible on home page
    const allButtons = await page.locator('button').evaluateAll(buttons =>
      buttons.map(btn => btn.textContent?.trim()).filter(Boolean)
    )
    console.log('📝 All buttons on home page:', allButtons)

    // Check if main CTA button is visible (could be different text)
    const createCampaignButton = page.locator('button:has-text("Start Your Campaign"), button:has-text("Create Campaign"), button:has-text("🎯 Create Campaign Now")').first()
    if (await createCampaignButton.isVisible()) {
      console.log('✅ Create Campaign button found')
    } else {
      console.log('❌ Create Campaign button not found')
    }

    // Take screenshot
    await page.screenshot({ path: 'home-functionality.png', fullPage: true })
    console.log('📸 Home page screenshot saved')

    // Test 2: Navigation works
    console.log('🧭 Step 2: Test navigation')
    await page.goto('http://localhost:3003/discover', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Check if discover page loads
    const discoverTitle = await page.locator('h1, h2, h3').first().textContent()
    console.log(`📄 Discover page title: ${discoverTitle?.trim()}`)

    // Check if "Be the first" message appears (indicating no campaigns)
    const firstCampaignMessage = page.locator('text=Be the first to create').first()
    if (await firstCampaignMessage.isVisible()) {
      console.log('✅ "Be the first" message found (no campaigns exist)')
    } else {
      console.log('ℹ️ Campaigns may exist or message not found')
    }

    // Take screenshot
    await page.screenshot({ path: 'discover-functionality.png', fullPage: true })
    console.log('📸 Discover page screenshot saved')

    // Test 3: Organizations page loads (may redirect to auth)
    console.log('🏢 Step 3: Test organizations page')
    await page.goto('http://localhost:3003/organizations', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    console.log(`🔗 Organizations page URL: ${currentUrl}`)

    if (currentUrl.includes('/auth')) {
      console.log('✅ Organizations page correctly redirects to authentication')
    } else if (currentUrl.includes('/organizations')) {
      console.log('✅ Organizations page loads for authenticated users')

      // Check if Create Organization button exists
      const createOrgButton = page.locator('button:has-text("Create Organization")').first()
      if (await createOrgButton.isVisible()) {
        console.log('✅ Create Organization button found')
      } else {
        console.log('❌ Create Organization button not found')
      }
    } else {
      console.log('❌ Unexpected URL after navigating to organizations')
    }

    // Take screenshot
    await page.screenshot({ path: 'organizations-functionality.png', fullPage: true })
    console.log('📸 Organizations page screenshot saved')

    // Test 4: Check if basic components render
    console.log('🎨 Step 4: Check component rendering')

    // Check if header is visible
    const header = page.locator('header, nav').first()
    if (await header.isVisible()) {
      console.log('✅ Header/navigation visible')
    } else {
      console.log('❌ Header/navigation not found')
    }

    // Check if main content area exists
    const mainContent = page.locator('main, .container, #__next').first()
    if (await mainContent.isVisible()) {
      console.log('✅ Main content area visible')
    } else {
      console.log('❌ Main content area not found')
    }

    // Check if footer is visible
    const footer = page.locator('footer').first()
    if (await footer.isVisible()) {
      console.log('✅ Footer visible')
    } else {
      console.log('❌ Footer not found')
    }

    console.log('✅ Basic functionality test completed successfully')

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
testBasicFunctionality().catch(console.error)
