import { test, expect } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Assets Access Control', () => {
  test('redirects unauthenticated users to auth', async ({ page }) => {
    test.skip(process.env.CI && !process.env.E2E_BASE_URL, 'No base URL in CI')
    await page.goto(baseURL + '/assets')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/auth')
    expect(page.url()).toContain('mode=login')
    expect(page.url()).toContain('from=%2Fassets')
  })
})

