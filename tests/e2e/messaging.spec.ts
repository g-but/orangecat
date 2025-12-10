import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Messaging System', () => {
  test.describe('Unauthenticated', () => {
    test('messages page shows unauthorized state for guests', async ({ page }) => {
      test.skip(process.env.CI && !process.env.E2E_BASE_URL, 'No base URL in CI')
      await page.goto(baseURL + '/messages')
      // The page loads but shows unauthorized state (doesn't hard redirect)
      await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible({ timeout: 10000 })
      // Should show unauthorized error or prompt to log in
      await expect(page.locator('text=Unauthorized')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Authenticated (requires test user)', () => {
    // These tests require a logged-in user session
    // They verify the messaging UI components load correctly

    test.beforeEach(async ({ page }) => {
      // Skip if no test auth is available
      test.skip(!process.env.E2E_TEST_USER_EMAIL, 'No test user configured')
    })

    test('messages page loads for authenticated user', async ({ page }) => {
      test.skip(true, 'Requires auth setup')
      await page.goto(baseURL + '/messages')
      // Verify the messages page loads
      await expect(page.locator('text=Messages')).toBeVisible({ timeout: 10000 })
    })

    test('can open new conversation modal', async ({ page }) => {
      test.skip(true, 'Requires auth setup')
      await page.goto(baseURL + '/messages')
      await page.click('button:has-text("New")')
      await expect(page.locator('text=New Message')).toBeVisible({ timeout: 5000 })
    })

    test('can search for users in new conversation modal', async ({ page }) => {
      test.skip(true, 'Requires auth setup')
      await page.goto(baseURL + '/messages')
      await page.click('button:has-text("New")')
      await page.fill('input[placeholder*="Search"]', 'test')
      // Wait for search results
      await page.waitForTimeout(500) // Debounce
      // Should show results or "No people found"
      await expect(
        page.locator('[role="button"]').or(page.locator('text=No people found'))
      ).toBeVisible({ timeout: 5000 })
    })
  })
})
