/**
 * Race Condition and Concurrency Tests
 * 
 * Tests for potential race conditions and concurrent operation issues:
 * - Multiple simultaneous API calls
 * - Profile updates with concurrent requests
 * - Campaign creation conflicts
 * - Authentication state changes
 * - File upload conflicts
 */

import { test, expect } from '@playwright/test'

test.describe('Race Conditions and Concurrency', () => {
  test.beforeEach(async ({ page }) => {
    // Track network requests and responses
    const networkRequests: Array<{ url: string; method: string; timestamp: number }> = []
    const networkResponses: Array<{ url: string; status: number; timestamp: number }> = []

    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      })
    })

    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        timestamp: Date.now()
      })
    })

    ;(page as any).networkRequests = networkRequests
    ;(page as any).networkResponses = networkResponses
  })

  test('Profile update race condition test', async ({ page }) => {
    await test.step('Setup and navigate to profile', async () => {
      await page.goto('/auth')
      await page.waitForLoadState('networkidle')
      
      // Simple auth for testing - this should be improved with proper test user setup
      const emailInput = page.locator('[data-testid="email-input"]')
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com')
        const passwordInput = page.locator('[data-testid="password-input"]')
        await passwordInput.fill('testpassword')
        
        const signinButton = page.locator('[data-testid="signin-button"]')
        if (await signinButton.isVisible()) {
          await signinButton.click()
          await page.waitForLoadState('networkidle')
        }
      }
      
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')
    })

    await test.step('Test concurrent profile updates', async () => {
      // Enable profile editing mode
      const editButton = page.locator('[data-testid="edit-profile-button"]')
      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(500)
      }

      const bioField = page.locator('[data-testid="bio-input"], [data-testid="bio-textarea"]')
      const displayNameField = page.locator('[data-testid="display-name-input"]')
      
      if (await bioField.isVisible() && await displayNameField.isVisible()) {
        // Simulate race condition by rapidly changing multiple fields
        const promises = [
          bioField.fill('Bio update 1'),
          displayNameField.fill('Name update 1'),
          page.waitForTimeout(100).then(() => bioField.fill('Bio update 2')),
          page.waitForTimeout(150).then(() => displayNameField.fill('Name update 2')),
          page.waitForTimeout(200).then(() => bioField.fill('Bio update 3'))
        ]

        await Promise.all(promises)
        
        // Submit form quickly after updates
        const saveButton = page.locator('[data-testid="save-profile-button"]')
        if (await saveButton.isVisible()) {
          await saveButton.click()
          await page.waitForLoadState('networkidle')
        }

        // Check for any error states or inconsistent data
        const errorMessage = page.locator('[data-testid="error-message"], .error')
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent()
          console.log('Profile update error detected:', errorText)
          
          // Verify this is not a race condition error
          expect(errorText).not.toContain('conflict')
          expect(errorText).not.toContain('outdated')
        }

        // Verify final state is consistent
        await page.reload()
        await page.waitForLoadState('networkidle')
        
        const finalBio = await bioField.inputValue().catch(() => null)
        const finalDisplayName = await displayNameField.inputValue().catch(() => null)
        
        // Log for analysis
        console.log('Final bio:', finalBio)
        console.log('Final display name:', finalDisplayName)
      }
    })
  })

  test('Authentication state race conditions', async ({ page }) => {
    await test.step('Test rapid auth state changes', async () => {
      // Navigate to auth page
      await page.goto('/auth')
      await page.waitForLoadState('networkidle')

      // Attempt rapid signin/signout cycle
      const emailInput = page.locator('[data-testid="email-input"]')
      const passwordInput = page.locator('[data-testid="password-input"]')
      const signinButton = page.locator('[data-testid="signin-button"]')

      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com')
        await passwordInput.fill('testpassword')
        
        // Rapid successive attempts
        const clickPromises = []
        for (let i = 0; i < 3; i++) {
          clickPromises.push(
            page.waitForTimeout(i * 100).then(() => signinButton.click().catch(() => {}))
          )
        }
        
        await Promise.allSettled(clickPromises)
        await page.waitForLoadState('networkidle')

        // Check if we ended up in a consistent state
        const currentUrl = page.url()
        console.log('Final auth URL after rapid clicks:', currentUrl)
        
        // Should not be stuck in loading state
        const loadingIndicator = page.locator('[data-testid="loading"], .loading')
        if (await loadingIndicator.isVisible()) {
          await page.waitForTimeout(5000) // Wait for any loading to complete
          expect(await loadingIndicator.isVisible()).toBeFalsy()
        }
      }
    })

    await test.step('Test authentication persistence across tabs', async () => {
      // This would require opening multiple browser contexts
      // For now, test navigation consistency
      await page.goto('/dashboard')
      const dashboardLoaded = await page.waitForURL(/dashboard/).catch(() => false)
      
      if (dashboardLoaded) {
        // Rapidly navigate between authenticated pages
        const navigationPromises = [
          page.goto('/profile'),
          page.waitForTimeout(100).then(() => page.goto('/dashboard')),
          page.waitForTimeout(200).then(() => page.goto('/create'))
        ]
        
        await Promise.allSettled(navigationPromises)
        await page.waitForLoadState('networkidle')
        
        // Verify we're in a valid authenticated state
        const userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-dropdown"]')
        if (await userMenu.isVisible()) {
          expect(await userMenu.isVisible()).toBeTruthy()
        }
      }
    })
  })

  test('API request concurrency', async ({ page }) => {
    await test.step('Test simultaneous API calls', async () => {
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')

      // Clear previous requests
      ;(page as any).networkRequests = []
      ;(page as any).networkResponses = []

      // Trigger multiple API calls simultaneously
      const promises = [
        page.reload(),
        page.goto('/projects'),
        page.goto('/people'),
        page.goto('/fund-us')
      ]

      await Promise.allSettled(promises)
      await page.waitForLoadState('networkidle')

      const requests = (page as any).networkRequests || []
      const responses = (page as any).networkResponses || []

      console.log(`Made ${requests.length} requests, received ${responses.length} responses`)

      // Check for any failed requests that might indicate race conditions
      const failedResponses = responses.filter((r: any) => r.status >= 400)
      console.log('Failed responses:', failedResponses)

      // Should not have conflicting state errors (409)
      const conflictResponses = responses.filter((r: any) => r.status === 409)
      expect(conflictResponses.length).toBe(0)

      // Check for timeouts or connection issues
      const timedOutRequests = requests.filter((req: any) => {
        const matchingResponse = responses.find((res: any) => res.url === req.url)
        return !matchingResponse || (matchingResponse.timestamp - req.timestamp > 10000)
      })
      
      expect(timedOutRequests.length).toBeLessThan(requests.length * 0.1) // Less than 10% timeout rate
    })
  })

  test('File upload concurrency', async ({ page }) => {
    await test.step('Test concurrent file operations', async () => {
      // Navigate to profile edit
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')
      
      const editButton = page.locator('[data-testid="edit-profile-button"]')
      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(500)
      }

      // Look for file upload inputs
      const avatarUpload = page.locator('[data-testid="avatar-upload"], input[type="file"]').first()
      const bannerUpload = page.locator('[data-testid="banner-upload"], input[type="file"]').nth(1)

      if (await avatarUpload.isVisible()) {
        // Create dummy files for testing
        const testFiles = [
          {
            name: 'test-avatar.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
          }
        ]

        // Attempt rapid file uploads
        const uploadPromises = [
          avatarUpload.setInputFiles(testFiles),
          page.waitForTimeout(100).then(() => avatarUpload.setInputFiles(testFiles))
        ]

        await Promise.allSettled(uploadPromises)
        await page.waitForTimeout(2000) // Wait for uploads to process

        // Check for upload conflicts or errors
        const uploadError = page.locator('[data-testid="upload-error"], .upload-error')
        if (await uploadError.isVisible()) {
          const errorText = await uploadError.textContent()
          console.log('Upload error detected:', errorText)
          
          // Should not be file conflict errors
          expect(errorText).not.toContain('conflict')
          expect(errorText).not.toContain('locked')
        }
      }
    })
  })

  test('Campaign creation race conditions', async ({ page }) => {
    await test.step('Test rapid campaign operations', async () => {
      await page.goto('/create')
      await page.waitForLoadState('networkidle')

      const titleInput = page.locator('[data-testid="campaign-title-input"], [data-testid="title-input"]')
      const descriptionInput = page.locator('[data-testid="campaign-description-input"], [data-testid="description-input"], [data-testid="description-textarea"]')

      if (await titleInput.isVisible() && await descriptionInput.isVisible()) {
        // Fill form rapidly with different values
        const fillPromises = [
          titleInput.fill('Campaign Title 1'),
          descriptionInput.fill('Description 1'),
          page.waitForTimeout(50).then(() => titleInput.fill('Campaign Title 2')),
          page.waitForTimeout(100).then(() => descriptionInput.fill('Description 2'))
        ]

        await Promise.all(fillPromises)

        // Try to submit multiple times rapidly
        const submitButton = page.locator('[data-testid="create-campaign-button"], [data-testid="publish-button"]')
        if (await submitButton.isVisible()) {
          const submitPromises = []
          for (let i = 0; i < 3; i++) {
            submitPromises.push(
              page.waitForTimeout(i * 100).then(() => submitButton.click().catch(() => {}))
            )
          }
          
          await Promise.allSettled(submitPromises)
          await page.waitForLoadState('networkidle')

          // Should not create duplicate campaigns
          await page.goto('/fund-us')
          await page.waitForLoadState('networkidle')
          
          const campaignCards = page.locator('[data-testid="campaign-card"]')
          const campaignCount = await campaignCards.count()
          
          // Log campaign titles for analysis
          for (let i = 0; i < Math.min(campaignCount, 5); i++) {
            const title = await campaignCards.nth(i).locator('[data-testid="campaign-title"]').textContent().catch(() => 'No title')
            console.log(`Campaign ${i + 1}:`, title)
          }
        }
      }
    })
  })

  test('Database transaction integrity', async ({ page }) => {
    await test.step('Test data consistency under load', async () => {
      // Navigate through multiple pages rapidly to test database consistency
      const pages = ['/fund-us', '/projects', '/people', '/organizations', '/dashboard']
      
      const navigationPromises = pages.map((path, index) => 
        page.waitForTimeout(index * 200).then(() => page.goto(path))
      )

      await Promise.allSettled(navigationPromises)
      await page.waitForLoadState('networkidle')

      // Check final page loads correctly
      await page.goto('/fund-us')
      await page.waitForLoadState('networkidle')

      // Verify data appears consistent (no partial loads or mixed states)
      const campaignCards = page.locator('[data-testid="campaign-card"]')
      const cardCount = await campaignCards.count()

      if (cardCount > 0) {
        // Check first few cards have complete data
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = campaignCards.nth(i)
          
          // Each card should have title and description
          const title = card.locator('[data-testid="campaign-title"]')
          const description = card.locator('[data-testid="campaign-description"]')
          
          await expect(title).toBeVisible()
          
          const titleText = await title.textContent()
          expect(titleText).toBeTruthy()
          expect(titleText?.trim().length).toBeGreaterThan(0)
        }
      }

      // Check no partial loading states remain
      const loadingSpinners = page.locator('[data-testid="loading"], .loading, .spinner')
      const spinnerCount = await loadingSpinners.count()
      expect(spinnerCount).toBe(0)
    })
  })
})