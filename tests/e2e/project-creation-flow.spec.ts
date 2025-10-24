/**
 * Project Creation E2E Tests
 *
 * Tests the complete user journey for creating a project:
 * 1. User authentication
 * 2. Navigate to project creation
 * 3. Fill out project form
 * 4. Submit and verify creation
 * 5. View created project
 */

import { test, expect } from '@playwright/test'

test.describe('🚀 Project Creation User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')

    // Ensure we're on the landing page
    await expect(page).toHaveTitle(/OrangeCat/)
  })

  test('complete project creation journey', async ({ page }) => {
    // Step 1: Navigate to authentication
    await page.getByRole('link', { name: /start your campaign/i }).click()

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/)

    // Mock authentication (in real E2E, would need actual auth flow)
    // For now, we'll assume the user is authenticated and navigate directly

    // Step 2: Navigate to project creation (assuming authenticated)
    await page.goto('/projects/create')

    // Step 3: Verify we're on the project creation page
    await expect(page.getByText('Create Your Project')).toBeVisible()
    await expect(page.getByText('Share your vision and launch in seconds')).toBeVisible()

    // Step 4: Fill out the project form
    // Title field
    const titleInput = page.getByLabel('Project Title *')
    await titleInput.fill('E2E Test Project')
    await expect(titleInput).toHaveValue('E2E Test Project')

    // Description field
    const descriptionTextarea = page.getByLabel('Description *')
    await descriptionTextarea.fill('This is a comprehensive end-to-end test project to verify the complete project creation flow works properly.')
    await expect(descriptionTextarea).toHaveValue('This is a comprehensive end-to-end test project to verify the complete project creation flow works properly.')

    // Goal amount
    const goalAmountInput = page.getByLabel('Goal Amount (optional)')
    await goalAmountInput.fill('50000')
    await expect(goalAmountInput).toHaveValue('50000')

    // Currency selection
    const currencySelect = page.getByLabel('Currency')
    await currencySelect.selectOption('SATS')
    await expect(currencySelect).toHaveValue('SATS')

    // Funding purpose
    const fundingPurposeInput = page.getByLabel('What will the funds be used for? (optional)')
    await fundingPurposeInput.fill('Development, testing, and deployment costs')
    await expect(fundingPurposeInput).toHaveValue('Development, testing, and deployment costs')

    // Bitcoin address
    const bitcoinAddressInput = page.getByLabel('Bitcoin Address (optional)')
    await bitcoinAddressInput.fill('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    await expect(bitcoinAddressInput).toHaveValue('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')

    // Select categories
    await page.getByText('technology').click()
    await page.getByText('education').click()

    // Step 5: Verify progress indicator updates
    await expect(page.getByText('Form Completion')).toBeVisible()
    await expect(page.getByText('95%')).toBeVisible() // Should show high completion

    // Step 6: Submit the form
    const submitButton = page.getByRole('button', { name: 'Create Project' })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // Step 7: Verify success feedback
    await expect(page.getByText('Project created successfully!')).toBeVisible()

    // Step 8: Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard\/projects/)

    // Step 9: Verify project appears in the list
    await expect(page.getByText('E2E Test Project')).toBeVisible()
    await expect(page.getByText('This is a comprehensive end-to-end test')).toBeVisible()
  })

  test('form validation prevents invalid submissions', async ({ page }) => {
    await page.goto('/projects/create')

    // Try to submit without required fields
    const submitButton = page.getByRole('button', { name: 'Create Project' })
    await expect(submitButton).toBeDisabled()

    // Fill only title
    await page.getByLabel('Project Title *').fill('Test Title')
    await expect(submitButton).toBeDisabled()

    // Fill description
    await page.getByLabel('Description *').fill('Test description')
    await expect(submitButton).toBeEnabled()

    // Try invalid Bitcoin address
    await page.getByLabel('Bitcoin Address (optional)').fill('invalid-address')
    await submitButton.click()

    // Should show validation error
    await expect(page.getByText('Please enter a valid Bitcoin address')).toBeVisible()
  })

  test('draft autosave prevents data loss', async ({ page }) => {
    await page.goto('/projects/create')

    // Fill out some form data
    await page.getByLabel('Project Title *').fill('Autosave Test Project')
    await page.getByLabel('Description *').fill('Testing draft autosave functionality')

    // Wait for autosave (10 seconds)
    await page.waitForTimeout(11000)

    // Refresh the page
    await page.reload()

    // Verify data is restored
    await expect(page.getByLabel('Project Title *')).toHaveValue('Autosave Test Project')
    await expect(page.getByLabel('Description *')).toHaveValue('Testing draft autosave functionality')

    // Verify success message
    await expect(page.getByText('Draft loaded from previous session')).toBeVisible()
  })

  test('progress indicator updates correctly', async ({ page }) => {
    await page.goto('/projects/create')

    // Initially should show low completion
    await expect(page.getByText('Form Completion')).toBeVisible()
    await expect(page.getByText('○ Title')).toBeVisible()
    await expect(page.getByText('○ Description')).toBeVisible()

    // Fill title
    await page.getByLabel('Project Title *').fill('Progress Test')
    await expect(page.getByText('✓ Title')).toBeVisible()

    // Fill description
    await page.getByLabel('Description *').fill('Testing progress indicator')
    await expect(page.getByText('✓ Description')).toBeVisible()

    // Fill Bitcoin address
    await page.getByLabel('Bitcoin Address (optional)').fill('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')
    await expect(page.getByText('✓ Bitcoin Address')).toBeVisible()

    // Should show high completion percentage
    await expect(page.locator('text=/8[0-9]%|9[0-9]%/')).toBeVisible()
  })

  test('error handling shows user-friendly messages', async ({ page }) => {
    await page.goto('/projects/create')

    // Fill valid form data
    await page.getByLabel('Project Title *').fill('Error Handling Test')
    await page.getByLabel('Description *').fill('Testing error message display')

    // Mock a network error by disconnecting (in real scenario)
    // For now, we'll test with invalid data that should trigger validation

    // Try to submit with invalid Bitcoin address
    await page.getByLabel('Bitcoin Address (optional)').fill('invalid-bitcoin-address')
    await page.getByRole('button', { name: 'Create Project' }).click()

    // Should show specific validation error, not generic error
    await expect(page.getByText('Please enter a valid Bitcoin address')).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/projects/create')

    // Verify mobile layout works
    await expect(page.getByText('Create Your Project')).toBeVisible()

    // Test form elements are accessible on mobile
    await page.getByLabel('Project Title *').fill('Mobile Test Project')
    await page.getByLabel('Description *').fill('Testing mobile responsiveness')

    // Verify submit button is visible and accessible
    const submitButton = page.getByRole('button', { name: 'Create Project' })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
  })

  test('accessibility features work correctly', async ({ page }) => {
    await page.goto('/projects/create')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Project Title *')).toBeFocused()

    await page.keyboard.press('Tab')
    // Should focus on description textarea

    // Test ARIA labels and roles
    await expect(page.getByRole('textbox', { name: 'Project Title *' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Description *' })).toBeVisible()

    // Test error announcements (when validation fails)
    await page.getByRole('button', { name: 'Create Project' }).click()
    await expect(page.getByText(/required|fix the errors/i)).toBeVisible()
  })
})
