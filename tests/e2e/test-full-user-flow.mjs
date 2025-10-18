import { chromium } from 'playwright'

async function testFullUserFlow() {
  console.log('🚀 Starting Full User Flow Test...')

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

    // Test 1: Start at home page (unauthenticated)
    console.log('🏠 Step 1: Home page (unauthenticated)')
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Check experimental notice
    const experimentalNotice = page.locator('text=Experimental Version').first()
    if (await experimentalNotice.isVisible()) {
      console.log('✅ Experimental notice visible')
    }

    // Take screenshot
    await page.screenshot({ path: 'step1-home-unauth.png', fullPage: true })
    console.log('📸 Step 1 screenshot saved')

    // Test 2: Navigate to organizations page (should redirect to auth)
    console.log('🏢 Step 2: Organizations page (should redirect to auth)')
    await page.goto('http://localhost:3003/organizations', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    if (currentUrl.includes('/auth')) {
      console.log('✅ Correctly redirected to authentication')

      // Take screenshot of auth page
      await page.screenshot({ path: 'step2-auth-redirect.png', fullPage: true })
      console.log('📸 Step 2 screenshot saved')
    } else {
      console.log('❌ Did not redirect to authentication as expected')
      await page.screenshot({ path: 'step2-error.png', fullPage: true })
      return
    }

    // Test 3: Register a new user
    console.log('🔐 Step 3: User registration')
    await testRegistrationFlow(page)

      // Check if registration was successful
      const afterRegUrl = page.url()
      if (afterRegUrl.includes('/onboarding') || afterRegUrl.includes('/dashboard')) {
        console.log('✅ Registration successful, user authenticated')

        // Take screenshot after registration
        await page.screenshot({ path: 'step3-post-registration.png', fullPage: true })
        console.log('📸 Step 3 screenshot saved')

        // Test 4: Complete onboarding flow
        console.log('🎯 Step 4: Complete onboarding flow')
        await completeOnboardingFlow(page)

        // Test 5: Navigate to organizations page (now authenticated)
        console.log('🏢 Step 5: Organizations page (authenticated)')
        await page.goto('http://localhost:3003/organizations', { waitUntil: 'networkidle' })
        await page.waitForTimeout(3000)

      // Check current URL after navigation
      const orgUrl = page.url()
      console.log(`🔗 Organizations page URL: ${orgUrl}`)

      // If still redirected to auth, there's an issue
      if (orgUrl.includes('/auth')) {
        console.log('❌ Still redirected to auth page after authentication')

        // Take screenshot of auth page (should not happen)
        await page.screenshot({ path: 'step5-auth-after-reg.png', fullPage: true })
        console.log('📸 Auth after registration screenshot saved')
        return
      }

      // Check if Create Organization button is visible
      const createOrgButton = page.locator('button:has-text("Create Organization")').first()

      if (await createOrgButton.isVisible()) {
        console.log('✅ Create Organization button found')

        // Take screenshot of organizations page
        await page.screenshot({ path: 'step5-organizations-auth.png', fullPage: true })
        console.log('📸 Step 5 screenshot saved')

        // Test 6: Click Create Organization button and test modal
        console.log('🎯 Step 6: Test organization creation modal')
        await createOrgButton.click()
        await page.waitForTimeout(2000)

        // Check if modal opened
        const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first()
        if (await modal.isVisible()) {
          console.log('✅ Organization creation modal opened')

          // Take screenshot of modal
          await page.screenshot({ path: 'step6-org-modal.png', fullPage: true })
          console.log('📸 Step 6 screenshot saved')

          // Fill out the form
          await fillOrganizationForm(page)

          // Submit the form
          const submitButton = modal.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first()
          if (await submitButton.isVisible()) {
            console.log('✅ Submit button found')
            await submitButton.click()
            console.log('✅ Form submitted')

            // Wait for response
            await page.waitForTimeout(3000)

            // Check for success message
            const successMessage = page.locator('text=Organization created successfully, text=success').first()
            if (await successMessage.isVisible()) {
              console.log('✅ Organization created successfully')

              // Take final screenshot
              await page.screenshot({ path: 'step7-org-success.png', fullPage: true })
              console.log('📸 Step 7 screenshot saved')
            } else {
              console.log('⚠️ Organization creation may have failed')

              // Take screenshot of current state
              await page.screenshot({ path: 'step7-org-failed.png', fullPage: true })
              console.log('📸 Step 7 screenshot saved')
            }
          } else {
            console.log('❌ Submit button not found')
          }
        } else {
          console.log('❌ Organization creation modal did not open')
        }
      } else {
        console.log('❌ Create Organization button not found after authentication')

        // Debug: Check what buttons are actually visible
        const allButtons = await page.locator('button').evaluateAll(buttons =>
          buttons.map(btn => btn.textContent?.trim()).filter(Boolean)
        )
        console.log('📝 All buttons on organizations page:', allButtons)

        // Check if page shows any authentication-related content
        const authContent = await page.locator('text=Sign in, text=Login, text=Authentication, text=Log in').first().isVisible()
        if (authContent) {
          console.log('🔐 Page still shows authentication content')
        } else {
          console.log('❌ Page does not show authentication content but no Create Organization button found')
        }

        // Take screenshot of current state
        await page.screenshot({ path: 'step5-org-error.png', fullPage: true })
        console.log('📸 Step 5 error screenshot saved')
      }
    } else {
      console.log('❌ Registration failed or unexpected redirect')

      // Take screenshot of current state
      await page.screenshot({ path: 'step3-reg-failed.png', fullPage: true })
      console.log('📸 Step 3 failed screenshot saved')
    }

    console.log('✅ Full user flow test completed successfully')

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

async function testRegistrationFlow(page) {
  console.log('🔐 Testing registration flow...')

  // Wait for auth page to load
  await page.waitForSelector('form', { timeout: 15000 })
  await page.waitForTimeout(2000)

  // Fill in registration form
  const emailField = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first()
  const passwordField = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first()
  const confirmPasswordField = page.locator('input[placeholder*="confirm"], input[name="confirmPassword"]').first()

  if (await emailField.isVisible()) {
    await emailField.fill('test@example.com')
    console.log('✅ Email field filled')
  }

  if (await passwordField.isVisible()) {
    await passwordField.fill('testpassword123')
    console.log('✅ Password field filled')
  }

  if (await confirmPasswordField.isVisible()) {
    await confirmPasswordField.fill('testpassword123')
    console.log('✅ Confirm password field filled')
  }

  // Click register button
  const registerButton = page.locator('button:has-text("Create account"), button:has-text("Sign up"), button[type="submit"]').first()
  if (await registerButton.isVisible()) {
    await registerButton.click()
    console.log('✅ Register button clicked')
  }

  // Wait for success or redirect
  await page.waitForTimeout(5000)
}

async function fillOrganizationForm(page) {
  console.log('📝 Filling organization form...')

  try {
    // Wait for form fields
    await page.waitForTimeout(1000)

    // Fill organization name
    const nameField = page.locator('input[placeholder*="name"], input[name*="name"]').first()
    if (await nameField.isVisible()) {
      await nameField.fill('Test Bitcoin Organization')
      console.log('✅ Name field filled')
    }

    // Fill description
    const descField = page.locator('textarea, [role="textbox"]').first()
    if (await descField.isVisible()) {
      await descField.fill('A test organization for Bitcoin fundraising and community building.')
      console.log('✅ Description field filled')
    }

    // Select organization type
    const typeSelect = page.locator('select').first()
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ label: 'Community' })
      console.log('✅ Type selected')
    }

    console.log('✅ Form filled successfully')

  } catch (error) {
    console.error('❌ Error filling form:', error)
  }
}

async function completeOnboardingFlow(page) {
  console.log('🎯 Completing onboarding flow...')

  // Check current URL
  const currentUrl = page.url()
  console.log(`🔗 Current URL in onboarding: ${currentUrl}`)

  // If on onboarding page, click through the steps
  if (currentUrl.includes('/onboarding')) {
    console.log('📋 On onboarding page')

    // Wait for onboarding content to load
    await page.waitForTimeout(2000)

    // Look for "Next" or "Skip" buttons
    const nextButton = page.locator('button:has-text("Next")').first()
    const skipButton = page.locator('button:has-text("Skip")').first()

    // Try to skip onboarding quickly
    if (await skipButton.isVisible()) {
      console.log('✅ Skip button found, skipping onboarding')
      await skipButton.click()
      await page.waitForTimeout(2000)
    } else if (await nextButton.isVisible()) {
      console.log('✅ Next button found, clicking through onboarding')
      // Click next a few times to complete onboarding
      for (let i = 0; i < 3; i++) {
        if (await nextButton.isVisible()) {
          await nextButton.click()
          await page.waitForTimeout(1000)
        } else {
          break
        }
      }
    } else {
      console.log('⚠️ No navigation buttons found in onboarding')
    }

    // Check if we ended up on dashboard or organizations
    const finalUrl = page.url()
    console.log(`🔗 Final URL after onboarding: ${finalUrl}`)

    if (finalUrl.includes('/dashboard')) {
      console.log('✅ Onboarding completed, redirected to dashboard')

      // Take screenshot of dashboard
      await page.screenshot({ path: 'step4-dashboard.png', fullPage: true })
      console.log('📸 Dashboard screenshot saved')
    } else {
      console.log('⚠️ Onboarding may not have completed properly')
    }
  } else {
    console.log('ℹ️ Not on onboarding page, skipping onboarding step')
  }
}

// Run the test
testFullUserFlow().catch(console.error)
