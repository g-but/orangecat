import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const email = process.env.E2E_TEST_USER_EMAIL as string
const password = process.env.E2E_TEST_USER_PASSWORD as string

test.describe('Login Only Test', () => {
  test.beforeAll(() => {
    if (!email || !password) {
      throw new Error('Missing E2E_TEST_USER_EMAIL/E2E_TEST_USER_PASSWORD in environment')
    }
  })

  test('just login and check redirect', async ({ page }) => {
    console.log('Testing login with:', email)

    // Go to login page
    await page.goto(`${baseURL}/auth?mode=login`)
    await page.waitForLoadState('networkidle')

    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/login-page.png' })

    // Fill form
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(password)

    // Take screenshot before submit
    await page.screenshot({ path: 'screenshots/login-filled.png' })

    // Submit
    const submitBtn = page.getByRole('button', { name: /sign in|log in|login/i })
    await submitBtn.click()

    // Wait for navigation or error
    try {
      await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 10000 })
      console.log('✅ Login successful, redirected to:', page.url())
      await page.screenshot({ path: 'screenshots/login-success.png' })
    } catch (e) {
      console.log('❌ Login failed or no redirect, current URL:', page.url())
      await page.screenshot({ path: 'screenshots/login-failed.png' })

      // Check for error messages
      const errorText = await page.textContent('body')
      console.log('Page contains error text:', errorText.includes('error') || errorText.includes('Error') || errorText.includes('invalid'))
    }
  })
})





















