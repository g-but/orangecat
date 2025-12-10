import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

const routes = [
  '/',
  '/discover',
  '/fundraising',
  '/about',
  '/blog',
  '/how-it-works',
  '/faq',
  '/privacy',
  '/terms',
  '/technology',
  '/docs',
  '/community',
  // Redirect checks
  '/browse',
  '/fund-us',
  '/donate',
]

test.describe('Public routes render', () => {
  for (const path of routes) {
    test(`GET ${path} renders without error`, async ({ page }) => {
      test.skip(process.env.CI && !process.env.E2E_BASE_URL, 'No base URL in CI')
      await page.goto(baseURL + path)
      await expect(page.locator('body')).toBeVisible()
    })
  }
})
