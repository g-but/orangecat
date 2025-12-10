import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

const protectedRoutes = [
  '/dashboard',
  '/timeline',
  '/settings',
  '/loans',
  '/assets',
  '/circles',
]

test.describe('Protected routes redirect unauthenticated', () => {
  for (const path of protectedRoutes) {
    test(`GET ${path} redirects to auth`, async ({ page }) => {
      test.skip(process.env.CI && !process.env.E2E_BASE_URL, 'No base URL in CI')
      await page.goto(baseURL + path)
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('/auth')
      expect(page.url()).toContain('mode=login')
    })
  }
})

