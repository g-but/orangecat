import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Project Creation Wizard', () => {
  test('steps, navigation, and field visibility', async ({ page }) => {
    // Go directly to the wizard (requires auth). If redirected, skip to avoid blocking CI.
    await page.goto(`${baseURL}/dashboard/projects/create`, { waitUntil: 'domcontentloaded' })

    // If we are on auth, short-circuit (storageState not available or app not running)
    if (page.url().includes('/auth')) {
      test.skip(true, 'Not authenticated; storageState missing or app not running')
    }

    // Step indicator present
    await expect(page.getByText(/Step\s+1\s+of\s+4/i)).toBeVisible()

    // Step 1 is optional (Template). Skip to Step 2
    const skipBtn = page.getByRole('button', { name: /skip/i })
    if (await skipBtn.isVisible()) {
      await skipBtn.click()
    } else {
      // Fallback: click Next
      await page.getByRole('button', { name: /next/i }).click()
    }

    // Step 2: Basic Information
    await expect(page.getByText(/Step\s+2\s+of\s+4/i)).toBeVisible()
    await expect(page.getByText(/Basic Information/i)).toBeVisible()
    // Fill required fields
    await page.locator('textarea, input').first().focus()
    const title = page.getByLabel(/title/i)
    const description = page.getByLabel(/description/i)
    if (await title.isVisible()) await title.fill('Wizard E2E Project')
    if (await description.isVisible()) await description.fill('Testing the wizard step flow')

    // Next to Step 3
    await page.getByRole('button', { name: /next/i }).click()

    // Step 3: Funding Details
    await expect(page.getByText(/Step\s+3\s+of\s+4/i)).toBeVisible()
    await expect(page.getByText(/Funding Details/i)).toBeVisible()
    // Verify expected fields are present (labels can vary slightly by UI)
    await expect(page.getByText(/Bitcoin Address/i)).toBeVisible()
    await expect(page.getByText(/Lightning/i)).toBeVisible()

    // Next to Step 4
    await page.getByRole('button', { name: /next/i }).click()

    // Step 4: Additional Details (optional)
    await expect(page.getByText(/Step\s+4\s+of\s+4/i)).toBeVisible()
    await expect(page.getByText(/Additional Details/i)).toBeVisible()
  })
})

