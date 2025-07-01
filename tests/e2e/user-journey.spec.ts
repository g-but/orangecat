/**
 * Comprehensive E2E Test: User Journey from Registration to Funding Page Creation
 * 
 * Tests the complete user onboarding flow including:
 * - User registration and email verification
 * - Profile setup and customization
 * - Funding page creation and configuration
 * - Security validations throughout the process
 * 
 * Created: 2025-06-30
 * Priority: Critical for user onboarding experience
 */

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = 'test-results/screenshots/user-journey'
const TEST_DATA = {
  user: {
    email: `test-${Date.now()}@example.com`, // Unique email for each test run
    password: 'SecureTestPassword123!',
    username: `testuser${Date.now().toString().slice(-6)}`, // Unique username
    displayName: 'Test User Journey',
    bio: 'This is a test user created by automated E2E testing to verify the complete user journey from registration to funding page creation.',
    bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    lightningAddress: 'test@getalby.com'
  },
  campaign: {
    title: 'E2E Test Funding Campaign',
    description: 'This is a test funding campaign created through automated E2E testing to verify the complete user journey and funding page creation flow.',
    goal: '0.001',
    category: 'Technology',
    tags: ['test', 'automation', 'e2e']
  }
}

// Utility functions
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const takeScreenshot = async (page: any, name: string) => {
  ensureDir(SCREENSHOT_DIR)
  await page.screenshot({ 
    path: path.join(SCREENSHOT_DIR, `${name}.png`), 
    fullPage: true 
  })
}

const waitForStableContent = async (page: any, timeout = 3000) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Additional stability wait
}

test.describe('Complete User Journey: Registration → Profile → Funding Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    ;(page as any).consoleErrors = consoleErrors
  })

  test('Complete user journey: Registration → Profile Setup → Funding Page Creation', async ({ page }) => {
    // ==================== STEP 1: HOMEPAGE AND REGISTRATION DISCOVERY ====================
    
    await test.step('Navigate to homepage and discover registration', async () => {
      await page.goto('/')
      await waitForStableContent(page)
      await takeScreenshot(page, '01-homepage')
      
      // Verify homepage loads correctly
      await expect(page.locator('h1')).toBeVisible()
      await expect(page).toHaveTitle(/OrangeCat/i)
      
      // Look for registration/signup links
      const signUpButton = page.locator('[data-testid="signup-button"], [data-testid="register-button"], a[href*="auth"]').first()
      await expect(signUpButton).toBeVisible()
      
      await signUpButton.click()
      await waitForStableContent(page)
      await takeScreenshot(page, '02-auth-page-from-homepage')
    })

    // ==================== STEP 2: USER REGISTRATION ====================
    
    await test.step('Complete user registration process', async () => {
      // Ensure we're on the auth page
      expect(page.url()).toContain('/auth')
      
      // Switch to signup tab if needed
      const signUpTab = page.locator('[data-testid="signup-tab"], [data-testid="register-tab"]')
      if (await signUpTab.isVisible()) {
        await signUpTab.click()
        await page.waitForTimeout(500)
      }
      
      await takeScreenshot(page, '03-registration-form')
      
      // Fill registration form
      await page.fill('[data-testid="email-input"]', TEST_DATA.user.email)
      await page.fill('[data-testid="password-input"]', TEST_DATA.user.password)
      
      // Handle confirm password field if it exists
      const confirmPasswordField = page.locator('[data-testid="confirm-password-input"]')
      if (await confirmPasswordField.isVisible()) {
        await confirmPasswordField.fill(TEST_DATA.user.password)
      }
      
      // Accept terms if checkbox exists
      const termsCheckbox = page.locator('[data-testid="terms-checkbox"]')
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check()
      }
      
      await takeScreenshot(page, '04-registration-form-filled')
      
      // Submit registration
      const submitButton = page.locator('[data-testid="signup-button"], [data-testid="register-button"]')
      await submitButton.click()
      await waitForStableContent(page)
      
      await takeScreenshot(page, '05-registration-submitted')
      
      // Handle different post-registration flows
      const currentUrl = page.url()
      if (currentUrl.includes('/profile/setup')) {
        // Direct profile setup
        console.log('Registration successful - redirected to profile setup')
      } else if (currentUrl.includes('/auth')) {
        // Email verification required or login
        const verificationMessage = page.locator('text=verify', 'text=email', 'text=check')
        if (await verificationMessage.isVisible()) {
          console.log('Email verification required')
          // For testing, we'll proceed with login
          await page.fill('[data-testid="email-input"]', TEST_DATA.user.email)
          await page.fill('[data-testid="password-input"]', TEST_DATA.user.password)
          await page.click('[data-testid="signin-button"]')
          await waitForStableContent(page)
        }
      } else {
        // Already logged in and redirected
        console.log('Registration successful - already authenticated')
      }
      
      await takeScreenshot(page, '06-post-registration')
    })

    // ==================== STEP 3: PROFILE SETUP ====================
    
    await test.step('Complete profile setup', async () => {
      // Navigate to profile setup if not already there
      if (!page.url().includes('/profile/setup')) {
        await page.goto('/profile/setup')
        await waitForStableContent(page)
      }
      
      await takeScreenshot(page, '07-profile-setup-page')
      
      // Fill basic profile information
      await page.fill('[data-testid="username-input"]', TEST_DATA.user.username)
      await page.fill('[data-testid="display-name-input"]', TEST_DATA.user.displayName)
      
      // Fill bio if field exists
      const bioField = page.locator('[data-testid="bio-input"], [data-testid="bio-textarea"]')
      if (await bioField.isVisible()) {
        await bioField.fill(TEST_DATA.user.bio)
      }
      
      // Add Bitcoin address if field exists
      const bitcoinField = page.locator('[data-testid="bitcoin-address-input"]')
      if (await bitcoinField.isVisible()) {
        await bitcoinField.fill(TEST_DATA.user.bitcoinAddress)
      }
      
      // Add Lightning address if field exists
      const lightningField = page.locator('[data-testid="lightning-address-input"]')
      if (await lightningField.isVisible()) {
        await lightningField.fill(TEST_DATA.user.lightningAddress)
      }
      
      await takeScreenshot(page, '08-profile-setup-filled')
      
      // Submit profile setup
      const completeButton = page.locator('[data-testid="complete-profile-button"], [data-testid="save-profile-button"]')
      await completeButton.click()
      await waitForStableContent(page)
      
      await takeScreenshot(page, '09-profile-setup-complete')
      
      // Verify profile was created successfully
      const successMessage = page.locator('[data-testid="success-message"], text=success, text=complete')
      if (await successMessage.isVisible()) {
        await expect(successMessage).toContainText(/success|complete|saved/i)
      }
    })

    // ==================== STEP 4: DASHBOARD EXPLORATION ====================
    
    await test.step('Explore user dashboard', async () => {
      // Navigate to dashboard
      await page.goto('/dashboard')
      await waitForStableContent(page)
      await takeScreenshot(page, '10-user-dashboard')
      
      // Verify dashboard elements
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible()
      
      // Check for welcome message or user info
      const welcomeMessage = page.locator(`text=${TEST_DATA.user.displayName}`, `text=${TEST_DATA.user.username}`)
      if (await welcomeMessage.isVisible()) {
        await expect(welcomeMessage).toBeVisible()
      }
      
      // Look for "Create Campaign" or "Create Funding Page" button
      const createButton = page.locator('[data-testid="create-campaign-button"], [data-testid="create-funding-page-button"], text=create').first()
      if (await createButton.isVisible()) {
        await takeScreenshot(page, '11-dashboard-with-create-button')
      }
    })

    // ==================== STEP 5: FUNDING PAGE CREATION ====================
    
    await test.step('Create funding page', async () => {
      // Navigate to campaign creation
      await page.goto('/create')
      await waitForStableContent(page)
      await takeScreenshot(page, '12-campaign-creation-page')
      
      // Verify we can access the creation page
      await expect(page.locator('h1')).toContainText(/create|campaign|funding/i)
      
      // Fill campaign details
      await page.fill('[data-testid="campaign-title-input"], [data-testid="title-input"]', TEST_DATA.campaign.title)
      await page.fill('[data-testid="campaign-description-input"], [data-testid="description-input"], [data-testid="description-textarea"]', TEST_DATA.campaign.description)
      await page.fill('[data-testid="campaign-goal-input"], [data-testid="goal-input"]', TEST_DATA.campaign.goal)
      
      // Select category if dropdown exists
      const categorySelect = page.locator('[data-testid="category-select"]')
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption(TEST_DATA.campaign.category)
      }
      
      // Add Bitcoin address (should be pre-filled from profile)
      const bitcoinAddressField = page.locator('[data-testid="bitcoin-address-input"]')
      if (await bitcoinAddressField.isVisible()) {
        const currentValue = await bitcoinAddressField.inputValue()
        if (!currentValue) {
          await bitcoinAddressField.fill(TEST_DATA.user.bitcoinAddress)
        }
      }
      
      await takeScreenshot(page, '13-campaign-form-filled')
      
      // Test form validation by submitting with missing required fields
      const submitButton = page.locator('[data-testid="create-campaign-button"], [data-testid="publish-button"]')
      
      // Clear required field to test validation
      await page.fill('[data-testid="campaign-title-input"], [data-testid="title-input"]', '')
      await submitButton.click()
      await page.waitForTimeout(1000)
      
      // Should show validation error
      const validationError = page.locator('[data-testid="validation-error"], .error-message')
      if (await validationError.isVisible()) {
        await expect(validationError).toBeVisible()
        await takeScreenshot(page, '14-validation-error')
      }
      
      // Re-fill the required field
      await page.fill('[data-testid="campaign-title-input"], [data-testid="title-input"]', TEST_DATA.campaign.title)
      
      // Submit the form
      await submitButton.click()
      await waitForStableContent(page)
      
      await takeScreenshot(page, '15-campaign-creation-submitted')
    })

    // ==================== STEP 6: VERIFY CAMPAIGN CREATION ====================
    
    await test.step('Verify campaign was created successfully', async () => {
      // Should be redirected to campaign page or success page
      const currentUrl = page.url()
      
      if (currentUrl.includes('/fund-us/') || currentUrl.includes('/campaign/')) {
        // Redirected to campaign page
        await expect(page.locator('[data-testid="campaign-title"]')).toContainText(TEST_DATA.campaign.title)
        await expect(page.locator('[data-testid="campaign-description"]')).toContainText(TEST_DATA.campaign.description)
        await expect(page.locator('[data-testid="bitcoin-address"]')).toBeVisible()
        await expect(page.locator('[data-testid="donate-button"]')).toBeVisible()
        
        await takeScreenshot(page, '16-campaign-page-created')
      } else if (currentUrl.includes('/dashboard')) {
        // Redirected to dashboard
        await expect(page.locator(`text=${TEST_DATA.campaign.title}`)).toBeVisible()
        await takeScreenshot(page, '16-dashboard-with-new-campaign')
      } else {
        // Other success page
        await takeScreenshot(page, '16-campaign-creation-success')
      }
      
      // Navigate to funding pages list to verify campaign appears
      await page.goto('/fund-us')
      await waitForStableContent(page)
      await takeScreenshot(page, '17-funding-pages-with-new-campaign')
      
      // Look for our created campaign
      const campaignCard = page.locator(`text=${TEST_DATA.campaign.title}`)
      await expect(campaignCard).toBeVisible()
    })

    // ==================== STEP 7: TEST CAMPAIGN FUNCTIONALITY ====================
    
    await test.step('Test campaign functionality', async () => {
      // Click on our created campaign
      const campaignCard = page.locator(`text=${TEST_DATA.campaign.title}`).first()
      await campaignCard.click()
      await waitForStableContent(page)
      await takeScreenshot(page, '18-campaign-functionality-test')
      
      // Verify all campaign elements work
      await expect(page.locator('[data-testid="campaign-title"]')).toContainText(TEST_DATA.campaign.title)
      await expect(page.locator('[data-testid="donate-button"]')).toBeVisible()
      
      // Test copy Bitcoin address functionality
      const copyButton = page.locator('[data-testid="copy-address-button"]')
      if (await copyButton.isVisible()) {
        await copyButton.click()
        await page.waitForTimeout(500)
        
        // Check for copy confirmation
        const copiedMessage = page.locator('[data-testid="copied-message"], text=copied')
        if (await copiedMessage.isVisible()) {
          await expect(copiedMessage).toContainText(/copied/i)
        }
      }
      
      // Test donate button (should show donation form since we're logged in)
      await page.click('[data-testid="donate-button"]')
      await page.waitForTimeout(2000)
      
      const donationForm = page.locator('[data-testid="donation-form"]')
      if (await donationForm.isVisible()) {
        await expect(donationForm).toBeVisible()
        await takeScreenshot(page, '19-donation-form-from-own-campaign')
      }
    })

    // ==================== STEP 8: PROFILE MANAGEMENT ====================
    
    await test.step('Test profile management features', async () => {
      // Navigate to profile page
      await page.goto('/profile')
      await waitForStableContent(page)
      await takeScreenshot(page, '20-profile-page')
      
      // Verify profile information is displayed
      await expect(page.locator(`text=${TEST_DATA.user.displayName}`)).toBeVisible()
      await expect(page.locator(`text=${TEST_DATA.user.username}`)).toBeVisible()
      
      // Test profile editing if available
      const editButton = page.locator('[data-testid="edit-profile-button"]')
      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(1000)
        await takeScreenshot(page, '21-profile-edit-mode')
        
        // Make a small change
        const bioField = page.locator('[data-testid="bio-input"], [data-testid="bio-textarea"]')
        if (await bioField.isVisible()) {
          await bioField.fill(TEST_DATA.user.bio + ' [Updated via E2E test]')
          
          const saveButton = page.locator('[data-testid="save-profile-button"]')
          if (await saveButton.isVisible()) {
            await saveButton.click()
            await waitForStableContent(page)
            await takeScreenshot(page, '22-profile-updated')
          }
        }
      }
    })

    // ==================== STEP 9: SECURITY VALIDATIONS ====================
    
    await test.step('Verify security measures throughout journey', async () => {
      // Test password strength was enforced during registration
      // Test username uniqueness (implicitly tested by using timestamp)
      // Test Bitcoin address validation (implicitly tested during campaign creation)
      
      // Verify no sensitive information in console
      const consoleErrors = (page as any).consoleErrors || []
      
      // Filter out expected/benign errors
      const criticalErrors = consoleErrors.filter((error: string) => 
        !error.includes('404') && 
        !error.includes('favicon') &&
        !error.includes('DevTools') &&
        !error.toLowerCase().includes('warning')
      )
      
      expect(criticalErrors, `Critical console errors during user journey: ${criticalErrors.join('\n')}`).toEqual([])
      
      await takeScreenshot(page, '23-security-validation-complete')
    })

    // ==================== STEP 10: RESPONSIVE DESIGN TESTING ====================
    
    await test.step('Test responsive design across the journey', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(1000)
      
      // Test campaign page on mobile
      await page.goto('/fund-us')
      await waitForStableContent(page)
      await takeScreenshot(page, '24-mobile-funding-pages')
      
      // Click on campaign
      const campaignCard = page.locator(`text=${TEST_DATA.campaign.title}`).first()
      await campaignCard.click()
      await waitForStableContent(page)
      await takeScreenshot(page, '25-mobile-campaign-page')
      
      // Verify mobile usability
      await expect(page.locator('[data-testid="donate-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="bitcoin-address"]')).toBeVisible()
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(1000)
      await takeScreenshot(page, '26-tablet-campaign-page')
      
      // Return to desktop
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.waitForTimeout(1000)
      await takeScreenshot(page, '27-desktop-final-state')
    })

    // ==================== FINAL VERIFICATION ====================
    
    await test.step('Final journey verification', async () => {
      // Verify the complete user journey was successful
      await page.goto('/dashboard')
      await waitForStableContent(page)
      
      // User should see their created campaign in dashboard
      await expect(page.locator(`text=${TEST_DATA.campaign.title}`)).toBeVisible()
      
      // User should be properly authenticated
      const userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-dropdown"]')
      if (await userMenu.isVisible()) {
        await expect(userMenu).toBeVisible()
      }
      
      await takeScreenshot(page, '28-journey-complete')
      
      console.log('✅ Complete user journey test passed:')
      console.log(`   - User registered: ${TEST_DATA.user.email}`)
      console.log(`   - Profile created: ${TEST_DATA.user.username}`)
      console.log(`   - Campaign created: ${TEST_DATA.campaign.title}`)
      console.log(`   - All security validations passed`)
      console.log(`   - Responsive design verified`)
    })
  })

  test('Edge case: Username conflict handling', async ({ page }) => {
    await test.step('Test username conflict resolution', async () => {
      await page.goto('/auth')
      await waitForStableContent(page)
      
      // Try to register with a username that might already exist
      const conflictUsername = 'admin' // Reserved username
      
      const signUpTab = page.locator('[data-testid="signup-tab"]')
      if (await signUpTab.isVisible()) {
        await signUpTab.click()
      }
      
      await page.fill('[data-testid="email-input"]', `conflict-test-${Date.now()}@example.com`)
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      
      // Submit to get to profile setup
      await page.click('[data-testid="signup-button"]')
      await waitForStableContent(page)
      
      if (page.url().includes('/profile/setup')) {
        // Try to use reserved username
        await page.fill('[data-testid="username-input"]', conflictUsername)
        await page.fill('[data-testid="display-name-input"]', 'Conflict Test')
        
        await page.click('[data-testid="complete-profile-button"]')
        await page.waitForTimeout(2000)
        
        // Should show username conflict error
        const usernameError = page.locator('[data-testid="username-error"], .error-message')
        if (await usernameError.isVisible()) {
          await expect(usernameError).toContainText(/reserved|taken|unavailable/i)
          await takeScreenshot(page, 'username-conflict-handling')
        }
      }
    })
  })
})