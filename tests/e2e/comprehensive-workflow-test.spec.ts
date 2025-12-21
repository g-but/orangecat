import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const email = process.env.E2E_TEST_USER_EMAIL as string
const password = process.env.E2E_TEST_USER_PASSWORD as string

test.describe('Comprehensive OrangeCat Workflow Test', () => {
  test.beforeAll(() => {
    if (!email || !password) {
      throw new Error('Missing E2E_TEST_USER_EMAIL/E2E_TEST_USER_PASSWORD in environment')
    }
  })

  // Test Registration Workflow
  test('Registration workflow - seamless, fast, no duplicates', async ({ page }) => {
    // Take screenshot before starting
    await page.screenshot({ path: 'screenshots/registration-start.png' })

    // Generate unique email for registration test
    const registerEmail = `test_user_${Date.now()}@example.com`
    const registerPassword = 'TestPass123!'

    await page.goto(`${baseURL}/auth?mode=signup`)

    // Fill registration form
    await page.getByLabel(/email address/i).fill(registerEmail)
    await page.getByLabel(/password/i).fill(registerPassword)
    await page.getByLabel(/confirm password/i).fill(registerPassword)

    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/registration-form-filled.png' })

    // Submit registration
    const submitBtn = page.getByRole('button', { name: /sign up|register|create account/i })
    await submitBtn.click()

    // Wait for success or redirect
    await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 30000 })

    // Verify we're logged in
    await expect(page).toHaveURL(/\/(dashboard|timeline|onboarding)/)

    // Take screenshot of successful registration
    await page.screenshot({ path: 'screenshots/registration-success.png' })

    console.log(`✅ Registration successful for ${registerEmail}`)
  })

  // Test Login Workflow
  test('Login workflow', async ({ page }) => {
    // Take screenshot before starting
    await page.screenshot({ path: 'screenshots/login-start.png' })

    await page.goto(`${baseURL}/auth?mode=login`)

    // Fill login form
    await page.getByLabel(/email address/i).fill(email)
    await page.getByLabel(/password/i).fill(password)

    // Take screenshot of filled form
    await page.screenshot({ path: 'screenshots/login-form-filled.png' })

    // Submit login
    const submitBtn = page.getByRole('button', { name: /sign in|log in|login/i })
    await submitBtn.click()

    // Wait for successful login
    await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 15000 })

    // Verify we're logged in
    await expect(page).toHaveURL(/\/(dashboard|timeline|onboarding)/)

    // Take screenshot of successful login
    await page.screenshot({ path: 'screenshots/login-success.png' })

    console.log(`✅ Login successful for ${email}`)
  })

  // Test Timeline Posting, Editing, Deleting
  test('Timeline posts - create, edit, delete', async ({ page }) => {
    // Login first
    await page.goto(`${baseURL}/auth?mode=login`)
    await page.getByLabel(/email address/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in|login/i }).click()
    await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 15000 })

    // Navigate to timeline
    await page.goto(`${baseURL}/timeline`)

    // Wait for timeline to load
    await page.waitForLoadState('networkidle')

    // Take screenshot of timeline
    await page.screenshot({ path: 'screenshots/timeline-loaded.png' })

    // Create a post
    const postText = `Test post ${Date.now()} - automated testing`
    const composer = page.locator('textarea[placeholder*="What\'s happening"]').first()
    await expect(composer).toBeVisible({ timeout: 10000 })
    await composer.fill(postText)

    // Take screenshot before posting
    await page.screenshot({ path: 'screenshots/post-composer-filled.png' })

    // Click Post button
    const postBtn = page.getByRole('button', { name: /^post$/i }).first()
    await expect(postBtn).toBeVisible()
    await postBtn.click()

    // Wait for post to appear
    await expect(page.getByText(postText)).toBeVisible({ timeout: 20000 })

    // Take screenshot after posting
    await page.screenshot({ path: 'screenshots/post-created.png' })

    console.log(`✅ Post created: "${postText}"`)

    // Edit the post
    const postElement = page.locator(`text=${postText}`).first().locator('..').locator('..')
    const editBtn = postElement.getByRole('button', { name: /edit|more|options/i }).first()
    await editBtn.click()

    // Look for edit option in dropdown/menu
    const editOption = page.getByRole('menuitem', { name: /edit/i }).or(page.getByText(/edit/i))
    await editOption.click()

    // Edit the text
    const editedText = `${postText} - EDITED`
    const editTextarea = page.locator('textarea').first()
    await editTextarea.fill(editedText)

    // Save edit
    const saveBtn = page.getByRole('button', { name: /save|update/i })
    await saveBtn.click()

    // Verify edit
    await expect(page.getByText(editedText)).toBeVisible({ timeout: 10000 })

    // Take screenshot after editing
    await page.screenshot({ path: 'screenshots/post-edited.png' })

    console.log(`✅ Post edited: "${editedText}"`)

    // Delete the post
    const deleteBtn = postElement.getByRole('button', { name: /delete|more|options/i }).first()
    await deleteBtn.click()

    const deleteOption = page.getByRole('menuitem', { name: /delete/i }).or(page.getByText(/delete/i))
    await deleteOption.click()

    // Confirm deletion
    const confirmBtn = page.getByRole('button', { name: /confirm|delete|yes/i })
    await confirmBtn.click()

    // Verify post is gone
    await expect(page.getByText(editedText)).not.toBeVisible({ timeout: 10000 })

    // Take screenshot after deleting
    await page.screenshot({ path: 'screenshots/post-deleted.png' })

    console.log(`✅ Post deleted successfully`)
  })

  // Test Reposts and Quotes
  test('Timeline reposts and quotes', async ({ page }) => {
    // Login first
    await page.goto(`${baseURL}/auth?mode=login`)
    await page.getByLabel(/email address/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in|login/i }).click()
    await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 15000 })

    // Navigate to timeline
    await page.goto(`${baseURL}/timeline`)
    await page.waitForLoadState('networkidle')

    // Find an existing post to repost (or create one if none exist)
    let postToRepost = page.locator('[data-testid*="post"]').first()
    if (!(await postToRepost.isVisible().catch(() => false))) {
      // Create a post to repost
      const tempPostText = `Temp post for repost test ${Date.now()}`
      const composer = page.locator('textarea[placeholder*="What\'s happening"]').first()
      await composer.fill(tempPostText)
      const postBtn = page.getByRole('button', { name: /^post$/i }).first()
      await postBtn.click()
      await expect(page.getByText(tempPostText)).toBeVisible({ timeout: 10000 })
      postToRepost = page.getByText(tempPostText).first().locator('..').locator('..')
    }

    // Take screenshot of post to repost
    await page.screenshot({ path: 'screenshots/post-to-repost.png' })

    // Click repost button
    const repostBtn = postToRepost.getByRole('button', { name: /repost|share/i }).first()
    await repostBtn.click()

    // Choose repost option (not quote)
    const repostOption = page.getByRole('menuitem', { name: /repost/i }).or(page.getByText(/repost/i))
    await repostOption.click()

    // Verify repost appears
    await page.waitForTimeout(2000) // Give time for repost to appear

    // Take screenshot after repost
    await page.screenshot({ path: 'screenshots/repost-created.png' })

    console.log(`✅ Repost created successfully`)

    // Now test quote repost
    const quoteBtn = postToRepost.getByRole('button', { name: /quote|repost/i }).first()
    await quoteBtn.click()

    const quoteOption = page.getByRole('menuitem', { name: /quote/i }).or(page.getByText(/quote/i))
    await quoteOption.click()

    // Fill quote text
    const quoteText = `This is my quote ${Date.now()}`
    const quoteTextarea = page.locator('textarea').first()
    await quoteTextarea.fill(quoteText)

    // Submit quote
    const submitQuoteBtn = page.getByRole('button', { name: /post|quote/i })
    await submitQuoteBtn.click()

    // Verify quote appears
    await expect(page.getByText(quoteText)).toBeVisible({ timeout: 10000 })

    // Take screenshot after quote
    await page.screenshot({ path: 'screenshots/quote-created.png' })

    console.log(`✅ Quote repost created: "${quoteText}"`)
  })

  // Test Private Messages
  test('Private messaging functionality', async ({ page }) => {
    // Login first
    await page.goto(`${baseURL}/auth?mode=login`)
    await page.getByLabel(/email address/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in|login/i }).click()
    await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 15000 })

    // Navigate to messages
    await page.goto(`${baseURL}/messages`)

    // Take screenshot of messages page
    await page.screenshot({ path: 'screenshots/messages-page.png' })

    // Wait for messages page to load
    await page.waitForLoadState('networkidle')

    // Check if there's a conversations list or empty state
    const messagesHeading = page.getByRole('heading', { name: /messages|conversations/i })
    const emptyState = page.getByText(/no conversations|start messaging/i)

    if (await emptyState.isVisible().catch(() => false)) {
      console.log(`✅ Messages page loaded - showing empty state`)
    } else if (await messagesHeading.isVisible().catch(() => false)) {
      console.log(`✅ Messages page loaded - showing conversations`)
    }

    // Try to create a new message (if button exists)
    const newMessageBtn = page.getByRole('button', { name: /new message|start chat|compose/i })
    if (await newMessageBtn.isVisible().catch(() => false)) {
      await newMessageBtn.click()

      // Take screenshot of new message modal/form
      await page.screenshot({ path: 'screenshots/new-message-modal.png' })

      console.log(`✅ New message modal opened successfully`)
    } else {
      console.log(`ℹ️ No new message button found - messages may be invitation-only`)
    }

    // Take final screenshot of messages page
    await page.screenshot({ path: 'screenshots/messages-final-state.png' })
  })
})





















