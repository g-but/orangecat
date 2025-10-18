/**
 * End-to-end test: Ensure the homepage loads without console errors and capture a screenshot.
 * created_date: 2025-06-12
 * last_modified_date: 2025-06-12
 * last_modified_summary: Initial Playwright e2e test that navigates to the root URL and saves a full-page screenshot.
 */

import { test, expect } from '@playwright/test'

const SCREENSHOT_DIR = 'test-results/screenshots'

// Ensure the directory exists before writing (Playwright won't create nested paths automatically)
import fs from 'fs'
import path from 'path'

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

test('homepage renders and has expected title', async ({ page }) => {
  // Navigate to baseURL (configured in playwright.config.ts)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Capture any severe console errors (excluding warnings)
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // Expect the title to contain OrangeCat
  await expect(page).toHaveTitle(/OrangeCat/i)

  // Screenshot
  ensureDir(SCREENSHOT_DIR)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home.png'), fullPage: true })

  // Fail test if there were console errors
  expect(consoleErrors, `Console errors on homepage: ${consoleErrors.join('\n')}`).toEqual([])
}) 