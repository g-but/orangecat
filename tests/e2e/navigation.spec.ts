import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Navigation', () => {
  test('main nav routes render', async ({ page }) => {
    test.skip(process.env.CI && !process.env.E2E_BASE_URL, 'No base URL in CI')

    const routes = [
      { name: 'Browse', path: '/discover' },
      { name: 'Fund Us', path: '/fundraising' },
      { name: 'Fund Us (legacy redirect)', path: '/fund-us' },
      { name: 'About', path: '/about' },
      { name: 'Blog', path: '/blog' },
    ]

    for (const route of routes) {
      await page.goto(baseURL + route.path)
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
