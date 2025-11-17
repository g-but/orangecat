import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Smoke', () => {
  test('home page renders', async ({ page }) => {
    test.skip(process.env.CI && !process.env.E2E_BASE_URL, 'No base URL in CI')
    await page.goto(baseURL + '/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('docs page renders', async ({ page }) => {
    test.skip(process.env.CI && !process.env.E2E_BASE_URL, 'No base URL in CI')
    await page.goto(baseURL + '/docs')
    await expect(page.locator('body')).toBeVisible()
  })
})

