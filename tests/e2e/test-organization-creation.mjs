import { chromium } from 'playwright'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function testOrganizationCreation() {
  console.log('🚀 Starting Organization Creation Test...')

  let browser
  let serverProcess

  try {
    // Start the development server
    console.log('📦 Starting development server...')
    serverProcess = exec('npm run dev')

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Launch browser
    console.log('🌐 Launching browser...')
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000, // Slow down for visibility
      args: ['--window-size=1280,720']
    })

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    })

    const page = await context.newPage()

    // Navigate to home page
    console.log('🏠 Navigating to home page...')
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle' })

    // Wait for page to load
    await page.waitForTimeout(2000)

    // Check if we're on the home page
    const title = await page.title()
    console.log(`📄 Page title: ${title}`)

    // Look for the "Create Your First Campaign" button or similar
    const createCampaignButton = page.locator('button:has-text("Create Your First Campaign"), button:has-text("🎯 Create Campaign Now")').first()

    if (await createCampaignButton.isVisible()) {
      console.log('✅ Found campaign creation CTA')

      // Click the create campaign button
      await createCampaignButton.click()

      // Wait for navigation or modal
      await page.waitForTimeout(2000)

      // Check if we're redirected to auth or if modal opens
      const currentUrl = page.url()
      console.log(`🔗 Current URL: ${currentUrl}`)

      if (currentUrl.includes('/auth')) {
        console.log('🔐 Redirected to authentication page')

        // Test registration flow
        await testRegistrationFlow(page)
      } else if (currentUrl.includes('/create')) {
        console.log('✅ Already authenticated, proceeding to campaign creation')
      }
    } else {
      console.log('❌ Campaign creation CTA not found, checking if user is already authenticated...')

      // Check if we're already on an authenticated page
      const dashboardLink = page.locator('a[href="/dashboard"], [href="/organizations"]').first()

      if (await dashboardLink.isVisible()) {
        console.log('✅ User appears to be authenticated')

        // Navigate to organizations page
        await page.goto('http://localhost:3003/organizations', { waitUntil: 'networkidle' })
        await page.waitForTimeout(2000)
      } else {
        // Try to go directly to auth
        await page.goto('http://localhost:3003/auth?mode=register', { waitUntil: 'networkidle' })
        await testRegistrationFlow(page)
      }
    }

    // Now test organization creation
    await testOrganizationCreationFlow(page)

  } catch (error) {
    console.error('❌ Test failed:', error)

    // Take screenshot on error
    if (browser) {
      const page = await browser.newPage()
      await page.goto('http://localhost:3003', { waitUntil: 'networkidle' })
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
      console.log('📸 Error screenshot saved to error-screenshot.png')
    }
  } finally {
    // Clean up
    if (browser) {
      await browser.close()
      console.log('🔒 Browser closed')
    }

    if (serverProcess) {
      console.log('🛑 Stopping development server...')
      serverProcess.kill()
    }

    console.log('🏁 Test completed')
  }
}

async function testRegistrationFlow(page) {
  console.log('🔐 Testing registration flow...')

  // Wait for auth page to load with longer timeout
  await page.waitForSelector('form', { timeout: 15000 })
  await page.waitForTimeout(2000) // Extra wait for form to be interactive

  // Take a screenshot before filling form
  await page.screenshot({ path: 'auth-form-before.png', fullPage: true })
  console.log('📸 Auth form screenshot saved')

  // Fill in registration form with more specific selectors
  const emailField = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first()
  const passwordField = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first()
  const confirmPasswordField = page.locator('input[placeholder*="confirm"], input[name="confirmPassword"]').first()

  if (await emailField.isVisible()) {
    await emailField.fill('test@example.com')
    console.log('✅ Email field filled')
  } else {
    console.log('❌ Email field not found')
    await page.screenshot({ path: 'auth-form-error.png', fullPage: true })
  }

  if (await passwordField.isVisible()) {
    await passwordField.fill('testpassword123')
    console.log('✅ Password field filled')
  } else {
    console.log('❌ Password field not found')
  }

  if (await confirmPasswordField.isVisible()) {
    await confirmPasswordField.fill('testpassword123')
    console.log('✅ Confirm password field filled')
  } else {
    console.log('❌ Confirm password field not found')
  }

  // Click register button
  const registerButton = page.locator('button:has-text("Create account"), button:has-text("Sign up"), button[type="submit"]').first()

  if (await registerButton.isVisible()) {
    console.log('✅ Found register button')
    await registerButton.click()
    console.log('✅ Register button clicked')
  } else {
    console.log('❌ Register button not found')
    await page.screenshot({ path: 'auth-buttons-error.png', fullPage: true })
  }

  // Wait for success or redirect with longer timeout
  await page.waitForTimeout(5000)

  const currentUrl = page.url()
  console.log(`🔗 After registration URL: ${currentUrl}`)

  if (currentUrl.includes('/onboarding') || currentUrl.includes('/dashboard') || currentUrl.includes('/organizations')) {
    console.log('✅ Registration successful')
    await page.screenshot({ path: 'registration-success.png', fullPage: true })
  } else {
    console.log('⚠️ Registration may have failed or redirected unexpectedly')
    await page.screenshot({ path: 'registration-failed.png', fullPage: true })
  }
}

async function testOrganizationCreationFlow(page) {
  console.log('🏢 Testing organization creation flow...')

  // Navigate to organizations page
  await page.goto('http://localhost:3000/organizations', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Look for "Create Organization" button
  const createOrgButton = page.locator('button:has-text("Create Organization")').first()

  if (await createOrgButton.isVisible()) {
    console.log('✅ Found Create Organization button')

    // Click the create organization button
    await createOrgButton.click()

    // Wait for modal to appear
    await page.waitForTimeout(1000)

    // Check if modal is open
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first()

    if (await modal.isVisible()) {
      console.log('✅ Organization creation modal opened')

      // Fill out the organization form
      await fillOrganizationForm(page)

      // Submit the form
      const submitButton = modal.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first()
      await submitButton.click()

      // Wait for submission
      await page.waitForTimeout(3000)

      // Check if organization was created successfully
      const successMessage = page.locator('text=Organization created successfully, text=success').first()

      if (await successMessage.isVisible()) {
        console.log('✅ Organization created successfully')

        // Take a screenshot of the success state
        await page.screenshot({ path: 'organization-created-success.png', fullPage: true })
        console.log('📸 Success screenshot saved')

      } else {
        console.log('⚠️ Organization creation may have failed')

        // Take screenshot of current state
        await page.screenshot({ path: 'organization-creation-state.png', fullPage: true })
        console.log('📸 State screenshot saved')
      }

    } else {
      console.log('❌ Organization creation modal did not open')
    }

  } else {
    console.log('❌ Create Organization button not found')

    // Take screenshot of current state
    await page.screenshot({ path: 'organizations-page-state.png', fullPage: true })
    console.log('📸 Organizations page screenshot saved')
  }
}

async function fillOrganizationForm(page) {
  console.log('📝 Filling organization form...')

  try {
    // Wait for form fields to be available
    await page.waitForTimeout(1000)

    // Fill organization name
    const nameField = page.locator('input[placeholder*="name"], input[name*="name"]').first()
    if (await nameField.isVisible()) {
      await nameField.fill('Test Bitcoin Organization')
    }

    // Fill description
    const descField = page.locator('textarea, [role="textbox"]').first()
    if (await descField.isVisible()) {
      await descField.fill('A test organization for Bitcoin fundraising and community building.')
    }

    // Select organization type
    const typeSelect = page.locator('select').first()
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ label: 'Community' })
    }

    // Fill website (optional)
    const websiteField = page.locator('input[placeholder*="website"], input[type="url"]').first()
    if (await websiteField.isVisible()) {
      await websiteField.fill('https://test-org.example.com')
    }

    console.log('✅ Form filled successfully')

  } catch (error) {
    console.error('❌ Error filling form:', error)
  }
}

// Run the test
testOrganizationCreation().catch(console.error)
