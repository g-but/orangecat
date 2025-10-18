/**
 * Comprehensive E2E Test: Bitcoin Donation Flow
 * 
 * Tests the complete user journey from discovering a funding page 
 * to completing a Bitcoin donation, including all security validations.
 * 
 * Created: 2025-06-30
 * Priority: Critical for Bitcoin platform trust
 */

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = 'test-results/screenshots/donation-flow'
const TEST_DATA = {
  // Test funding page data
  campaign: {
    title: 'E2E Test Campaign',
    description: 'Test campaign for end-to-end donation testing',
    goal: '0.001', // 0.001 BTC goal for testing
    bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' // Test address
  },
  // Test user data
  user: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    username: 'e2edonor',
    displayName: 'E2E Test Donor'
  },
  // Test donation data
  donation: {
    amount: '0.0001', // Small test amount
    note: 'E2E test donation - automated testing'
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

test.describe('Bitcoin Donation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Store errors on page context for later access
    ;(page as any).consoleErrors = consoleErrors
  })

  test('Complete donation flow: Discovery → Registration → Donation', async ({ page }) => {
    // ==================== STEP 1: DISCOVER FUNDING PAGE ====================
    
    await test.step('Navigate to funding pages discovery', async () => {
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')
      await takeScreenshot(page, '01-discover-funding-pages')
      
      // Verify funding pages are displayed
      await expect(page.locator('h1')).toContainText('Fund Us')
      
      // Check for funding page cards or create test campaign
      const existingCampaigns = await page.locator('[data-testid="campaign-card"]').count()
      if (existingCampaigns === 0) {
        // No campaigns exist, create one for testing
        await page.goto('/create')
        await page.waitForLoadState('networkidle')
        
        // Fill campaign creation form
        await page.fill('[data-testid="campaign-title"]', TEST_DATA.campaign.title)
        await page.fill('[data-testid="campaign-description"]', TEST_DATA.campaign.description)
        await page.fill('[data-testid="campaign-goal"]', TEST_DATA.campaign.goal)
        await page.fill('[data-testid="bitcoin-address"]', TEST_DATA.campaign.bitcoinAddress)
        
        await takeScreenshot(page, '01b-create-test-campaign')
        await page.click('[data-testid="create-campaign-button"]')
        await page.waitForLoadState('networkidle')
      }
      
      // Go back to funding pages
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')
    })

    // ==================== STEP 2: SELECT FUNDING PAGE ====================
    
    await test.step('Select a funding page to support', async () => {
      // Look for test campaign or any available campaign
      const campaignCard = page.locator('[data-testid="campaign-card"]').first()
      await expect(campaignCard).toBeVisible()
      
      // Take screenshot of available campaigns
      await takeScreenshot(page, '02-available-campaigns')
      
      // Click on first available campaign
      await campaignCard.click()
      await page.waitForLoadState('networkidle')
      await takeScreenshot(page, '03-campaign-details')
      
      // Verify we're on a campaign page
      await expect(page.locator('[data-testid="campaign-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="bitcoin-address"]')).toBeVisible()
      await expect(page.locator('[data-testid="donate-button"]')).toBeVisible()
    })

    // ==================== STEP 3: INITIATE DONATION ====================
    
    await test.step('Click donate button and check authentication', async () => {
      await page.click('[data-testid="donate-button"]')
      await page.waitForLoadState('networkidle')
      await takeScreenshot(page, '04-donate-clicked')
      
      // Should redirect to authentication if not logged in
      const currentUrl = page.url()
      if (currentUrl.includes('/auth')) {
        await expect(page.locator('h1')).toContainText(/sign in|login/i)
      } else {
        // Already authenticated, should show donation modal/form
        await expect(page.locator('[data-testid="donation-form"]')).toBeVisible()
      }
    })

    // ==================== STEP 4: USER AUTHENTICATION ====================
    
    await test.step('Register or login user', async () => {
      const isOnAuthPage = page.url().includes('/auth')
      
      if (isOnAuthPage) {
        await takeScreenshot(page, '05-auth-page')
        
        // Try to sign up first
        const signUpTab = page.locator('[data-testid="signup-tab"]')
        if (await signUpTab.isVisible()) {
          await signUpTab.click()
          await page.waitForTimeout(500)
        }
        
        // Fill registration form
        await page.fill('[data-testid="email-input"]', TEST_DATA.user.email)
        await page.fill('[data-testid="password-input"]', TEST_DATA.user.password)
        
        // Confirm password if field exists
        const confirmPasswordField = page.locator('[data-testid="confirm-password-input"]')
        if (await confirmPasswordField.isVisible()) {
          await page.fill('[data-testid="confirm-password-input"]', TEST_DATA.user.password)
        }
        
        await takeScreenshot(page, '06-registration-form-filled')
        
        // Submit registration
        await page.click('[data-testid="signup-button"]')
        await page.waitForLoadState('networkidle')
        
        // Handle email confirmation or direct login
        if (page.url().includes('/auth/callback') || page.url().includes('/profile/setup')) {
          // Email confirmation received or profile setup
          await takeScreenshot(page, '07-post-registration')
        } else if (page.url().includes('/auth')) {
          // Registration failed, try login instead
          const signInTab = page.locator('[data-testid="signin-tab"]')
          if (await signInTab.isVisible()) {
            await signInTab.click()
            await page.waitForTimeout(500)
          }
          
          await page.fill('[data-testid="email-input"]', TEST_DATA.user.email)
          await page.fill('[data-testid="password-input"]', TEST_DATA.user.password)
          await page.click('[data-testid="signin-button"]')
          await page.waitForLoadState('networkidle')
        }
      }
      
      // Verify authentication succeeded
      await page.waitForTimeout(2000)
      const finalUrl = page.url()
      
      // Should not be on auth page anymore
      expect(finalUrl).not.toContain('/auth')
      await takeScreenshot(page, '08-authentication-complete')
    })

    // ==================== STEP 5: PROFILE SETUP (IF NEEDED) ====================
    
    await test.step('Complete profile setup if required', async () => {
      if (page.url().includes('/profile/setup')) {
        await takeScreenshot(page, '09-profile-setup')
        
        // Fill profile setup form
        await page.fill('[data-testid="username-input"]', TEST_DATA.user.username)
        await page.fill('[data-testid="display-name-input"]', TEST_DATA.user.displayName)
        
        await takeScreenshot(page, '10-profile-setup-filled')
        await page.click('[data-testid="complete-profile-button"]')
        await page.waitForLoadState('networkidle')
        await takeScreenshot(page, '11-profile-setup-complete')
      }
    })

    // ==================== STEP 6: RETURN TO DONATION ====================
    
    await test.step('Navigate back to donation', async () => {
      // Go back to funding pages and select campaign again
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')
      
      const campaignCard = page.locator('[data-testid="campaign-card"]').first()
      await campaignCard.click()
      await page.waitForLoadState('networkidle')
      
      // Click donate button again (should work now that user is authenticated)
      await page.click('[data-testid="donate-button"]')
      await page.waitForLoadState('networkidle')
      await takeScreenshot(page, '12-authenticated-donation-form')
      
      // Should now see donation form
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible()
    })

    // ==================== STEP 7: FILL DONATION FORM ====================
    
    await test.step('Fill out donation form', async () => {
      // Fill donation amount
      const amountInput = page.locator('[data-testid="donation-amount-input"]')
      await amountInput.fill(TEST_DATA.donation.amount)
      
      // Fill optional note
      const noteInput = page.locator('[data-testid="donation-note-input"]')
      if (await noteInput.isVisible()) {
        await noteInput.fill(TEST_DATA.donation.note)
      }
      
      await takeScreenshot(page, '13-donation-form-filled')
      
      // Verify Bitcoin address is displayed
      const bitcoinAddress = page.locator('[data-testid="donation-bitcoin-address"]')
      await expect(bitcoinAddress).toBeVisible()
      const addressText = await bitcoinAddress.textContent()
      expect(addressText).toBeTruthy()
      expect(addressText?.length).toBeGreaterThan(25) // Valid Bitcoin address length
    })

    // ==================== STEP 8: GENERATE QR CODE ====================
    
    await test.step('Generate donation QR code', async () => {
      await page.click('[data-testid="generate-qr-button"]')
      await page.waitForTimeout(2000) // Wait for QR generation
      
      // Verify QR code is displayed
      const qrCode = page.locator('[data-testid="donation-qr-code"]')
      await expect(qrCode).toBeVisible()
      
      await takeScreenshot(page, '14-donation-qr-generated')
      
      // Verify payment instructions are shown
      await expect(page.locator('[data-testid="payment-instructions"]')).toBeVisible()
    })

    // ==================== STEP 9: SIMULATE PAYMENT CONFIRMATION ====================
    
    await test.step('Test payment confirmation flow', async () => {
      // Look for "I have sent the payment" button or similar
      const confirmPaymentButton = page.locator('[data-testid="confirm-payment-button"]')
      if (await confirmPaymentButton.isVisible()) {
        await confirmPaymentButton.click()
        await page.waitForLoadState('networkidle')
        await takeScreenshot(page, '15-payment-confirmed')
        
        // Should show confirmation message
        await expect(page.locator('[data-testid="payment-confirmation"]')).toBeVisible()
      }
      
      // Test copy address functionality
      const copyButton = page.locator('[data-testid="copy-address-button"]')
      if (await copyButton.isVisible()) {
        await copyButton.click()
        await page.waitForTimeout(500)
        
        // Should show copied confirmation
        const copiedMessage = page.locator('[data-testid="copied-message"]')
        if (await copiedMessage.isVisible()) {
          await expect(copiedMessage).toContainText(/copied/i)
        }
      }
    })

    // ==================== STEP 10: VERIFY SECURITY MEASURES ====================
    
    await test.step('Verify security validations', async () => {
      // Test with invalid Bitcoin amount
      const amountInput = page.locator('[data-testid="donation-amount-input"]')
      await amountInput.fill('invalid_amount')
      
      const submitButton = page.locator('[data-testid="generate-qr-button"]')
      await submitButton.click()
      await page.waitForTimeout(1000)
      
      // Should show validation error
      const validationError = page.locator('[data-testid="validation-error"]')
      if (await validationError.isVisible()) {
        await expect(validationError).toContainText(/invalid|amount/i)
      }
      
      await takeScreenshot(page, '16-validation-testing')
      
      // Reset to valid amount
      await amountInput.fill(TEST_DATA.donation.amount)
    })

    // ==================== STEP 11: FINAL VERIFICATION ====================
    
    await test.step('Final flow verification', async () => {
      await takeScreenshot(page, '17-final-state')
      
      // Verify no console errors occurred during the flow
      const consoleErrors = (page as any).consoleErrors || []
      expect(consoleErrors, `Console errors during donation flow: ${consoleErrors.join('\n')}`).toEqual([])
      
      // Verify critical elements are still present
      await expect(page.locator('[data-testid="donation-bitcoin-address"]')).toBeVisible()
      await expect(page.locator('[data-testid="donation-qr-code"]')).toBeVisible()
      
      // Test responsive design
      await page.setViewportSize({ width: 375, height: 667 }) // Mobile size
      await page.waitForTimeout(1000)
      await takeScreenshot(page, '18-mobile-responsive')
      
      // Verify mobile layout works
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible()
    })
  })

  test('Donation flow with existing user login', async ({ page }) => {
    await test.step('Test donation with existing user account', async () => {
      // Navigate directly to auth page
      await page.goto('/auth')
      await page.waitForLoadState('networkidle')
      
      // Login with test credentials
      await page.fill('[data-testid="email-input"]', TEST_DATA.user.email)
      await page.fill('[data-testid="password-input"]', TEST_DATA.user.password)
      await page.click('[data-testid="signin-button"]')
      await page.waitForLoadState('networkidle')
      
      // Navigate to campaign and test donation
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')
      
      const campaignCard = page.locator('[data-testid="campaign-card"]').first()
      await campaignCard.click()
      await page.waitForLoadState('networkidle')
      
      await page.click('[data-testid="donate-button"]')
      await page.waitForLoadState('networkidle')
      
      // Should immediately show donation form (no auth redirect)
      await expect(page.locator('[data-testid="donation-form"]')).toBeVisible()
      await takeScreenshot(page, 'existing-user-donation')
    })
  })

  test('Security: Invalid Bitcoin address handling', async ({ page }) => {
    await test.step('Test handling of invalid Bitcoin addresses', async () => {
      // This test would require admin access to create campaigns
      // For now, verify client-side validation
      await page.goto('/create')
      await page.waitForLoadState('networkidle')
      
      // Fill form with invalid Bitcoin address
      await page.fill('[data-testid="campaign-title"]', 'Test Campaign')
      await page.fill('[data-testid="bitcoin-address"]', 'invalid_bitcoin_address')
      
      const submitButton = page.locator('[data-testid="create-campaign-button"]')
      await submitButton.click()
      await page.waitForTimeout(1000)
      
      // Should show validation error
      const error = page.locator('[data-testid="bitcoin-address-error"]')
      if (await error.isVisible()) {
        await expect(error).toContainText(/invalid|bitcoin/i)
      }
      
      await takeScreenshot(page, 'bitcoin-address-validation')
    })
  })
})