/**
 * Project Editing E2E Tests
 *
 * Tests the complete user journey for editing existing projects:
 * 1. Navigate to project dashboard
 * 2. Click edit on draft project
 * 3. Load and modify project data
 * 4. Save changes successfully
 * 5. Verify changes persist
 */

import { test, expect } from '@playwright/test'

test.describe('🔧 Project Editing User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')

    // Ensure we're on the landing page
    await expect(page).toHaveTitle(/OrangeCat/)
  })

  test('complete project editing journey for draft', async ({ page }) => {
    // Step 1: Navigate to dashboard (assuming authenticated)
    await page.goto('/dashboard')

    // Step 2: Navigate to projects section
    await page.getByRole('link', { name: /projects/i }).click()
    await expect(page).toHaveURL(/.*projects/)

    // Step 3: Find a draft project and click edit
    // Look for projects that have "Edit" button (indicating draft status)
    const editButton = page.locator('button:has-text("Edit")').first()
    await expect(editButton).toBeVisible()

    // Get the project title before editing for comparison
    const projectCard = editButton.locator('..').locator('..').locator('..')
    const originalTitle = await projectCard.locator('h3').textContent()

    await editButton.click()

    // Step 4: Verify we're on the edit page
    await expect(page.getByText('Edit Your Project')).toBeVisible()
    await expect(page.getByText('Update your project details')).toBeVisible()

    // Step 5: Verify project data is loaded
    const titleInput = page.getByLabel('Project Title *')
    await expect(titleInput).toHaveValue(originalTitle || '')

    // Step 6: Modify project data
    const newTitle = `Edited: ${originalTitle} - ${Date.now()}`
    await titleInput.fill(newTitle)

    const descriptionTextarea = page.getByLabel('Description *')
    const currentDescription = await descriptionTextarea.inputValue()
    const newDescription = `${currentDescription}\n\nUpdated at: ${new Date().toISOString()}`
    await descriptionTextarea.fill(newDescription)

    // Step 7: Verify progress indicator updates
    await expect(page.getByText('Form Completion')).toBeVisible()

    // Step 8: Submit changes
    const updateButton = page.getByRole('button', { name: 'Update Project' })
    await expect(updateButton).toBeEnabled()
    await updateButton.click()

    // Step 9: Verify success feedback
    await expect(page.getByText('Project updated successfully!')).toBeVisible()

    // Step 10: Verify redirect to dashboard
    await expect(page).toHaveURL(/.*projects/)

    // Step 11: Verify changes are reflected in the project list
    await expect(page.getByText(newTitle)).toBeVisible()
  })

  test('edit published project via funding page', async ({ page }) => {
    // Step 1: Navigate to a published funding page
    await page.goto('/fund-us/some-project-id') // Would need actual project ID

    // Step 2: Click edit button (assuming user owns the project)
    const editButton = page.getByRole('button', { name: /edit/i })
    await expect(editButton).toBeVisible()
    await editButton.click()

    // Step 3: Verify we're on the edit page
    await expect(page.getByText('Edit Funding Page')).toBeVisible()

    // Step 4: Modify basic fields
    const titleInput = page.getByLabel('Page Title')
    const currentTitle = await titleInput.inputValue()
    await titleInput.fill(`${currentTitle} (Edited)`)

    // Step 5: Submit changes
    const saveButton = page.getByRole('button', { name: 'Save Changes' })
    await saveButton.click()

    // Step 6: Verify success and redirect
    await expect(page.getByText('Funding page updated successfully')).toBeVisible()
    await expect(page).toHaveURL(/.*fund-us/)
  })

  test('validation prevents invalid edits', async ({ page }) => {
    await page.goto('/projects/create?edit=some-project-id')

    // Try to clear required fields
    const titleInput = page.getByLabel('Project Title *')
    await titleInput.fill('')

    const descriptionTextarea = page.getByLabel('Description *')
    await descriptionTextarea.fill('')

    // Submit button should be disabled
    const updateButton = page.getByRole('button', { name: 'Update Project' })
    await expect(updateButton).toBeDisabled()

    // Fill invalid Bitcoin address
    const bitcoinInput = page.getByLabel('Bitcoin Address (optional)')
    await bitcoinInput.fill('invalid-address')
    await titleInput.fill('Valid Title')
    await descriptionTextarea.fill('Valid description')

    // Now submit should be enabled but validation should fail
    await expect(updateButton).toBeEnabled()
    await updateButton.click()

    // Should show validation error
    await expect(page.getByText('Please enter a valid Bitcoin address')).toBeVisible()
  })

  test('edit workflow preserves data integrity', async ({ page }) => {
    await page.goto('/projects/create?edit=some-project-id')

    // Load existing data
    await expect(page.getByText('Project loaded for editing')).toBeVisible()

    // Verify all fields have expected values
    const titleInput = page.getByLabel('Project Title *')
    const descriptionTextarea = page.getByLabel('Description *')
    const bitcoinInput = page.getByLabel('Bitcoin Address (optional)')

    // All fields should have values (not empty)
    await expect(titleInput).not.toHaveValue('')
    await expect(descriptionTextarea).not.toHaveValue('')
    // Bitcoin address might be empty, which is fine

    // Make a small change
    const originalTitle = await titleInput.inputValue()
    await titleInput.fill(`${originalTitle} (Test Edit)`)

    // Submit
    const updateButton = page.getByRole('button', { name: 'Update Project' })
    await updateButton.click()

    // Verify success
    await expect(page.getByText('Project updated successfully!')).toBeVisible()
  })

  test('unauthorized users cannot edit projects', async ({ page }) => {
    // Try to edit a project that doesn't belong to the user
    await page.goto('/projects/create?edit=unauthorized-project-id')

    // Should show error loading project
    await expect(page.getByText('Failed to load project for editing')).toBeVisible()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('edit form handles loading states properly', async ({ page }) => {
    await page.goto('/projects/create?edit=some-project-id')

    // Should show loading state initially
    await expect(page.getByText('Loading project for editing...')).toBeVisible()

    // Should eventually load the form
    await expect(page.getByText('Edit Your Project')).toBeVisible()
  })
})
