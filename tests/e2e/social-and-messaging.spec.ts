import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const email = process.env.E2E_TEST_USER_EMAIL as string
const password = process.env.E2E_TEST_USER_PASSWORD as string

test.describe('Auth, Timeline, and Messaging', () => {
  test.beforeAll(() => {
    if (!email || !password) {
      throw new Error('Missing E2E_TEST_USER_EMAIL/E2E_TEST_USER_PASSWORD in environment')
    }
  })

  test('login, post on timeline, and open messages', async ({ page }) => {
    // Login via /auth
    await page.goto(`${baseURL}/auth?mode=login`)
    await page.getByLabel(/email address/i).fill(email)
    await page.locator('input[type="password"]').fill(password)
    // Submit form
    const submit = page.getByRole('button', { name: /sign in|log in|login/i })
    if (await submit.isVisible().catch(() => false)) {
      await submit.click()
    } else {
      // Fallback to pressing Enter
      await page.keyboard.press('Enter')
    }

    // After login, navigate directly to timeline (handles redirect timing differences)
    await page.goto(`${baseURL}/timeline`)

    // Compose (mobile composer fallback): textarea with placeholder "What's happening?"
    const composer = page.locator('textarea[placeholder="What\'s happening?"]').first()
    await expect(composer).toBeVisible({ timeout: 15000 })
    const postText = `Automated post ${Date.now()}`
    await composer.fill(postText)

    // Click Post button
    const postBtn = page.getByRole('button', { name: /^post$/i }).first()
    await expect(postBtn).toBeVisible()
    await postBtn.click()

    // Wait for post to appear somewhere on page (optimistic may render instantly or after refresh)
    await expect(page.getByText(postText).first()).toBeVisible({ timeout: 20000 })

    // Navigate to messages and expect page to render
    await page.goto(`${baseURL}/messages`)
    // It may auto-create or redirect to a conversation id
    await page.waitForURL(/\/messages(\?.*)?$/, { timeout: 15000 })
    // Verify messages heading or common UI element
    const messagesHeading = page.getByRole('heading', { name: /messages/i })
    await expect(messagesHeading.or(page.locator('text=Messages'))).toBeVisible({ timeout: 15000 })
  })
})

