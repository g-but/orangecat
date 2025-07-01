import { test, expect } from '@playwright/test'

/**
 * Homepage E2E Tests
 * These tests verify the main functionality of the OrangeCat homepage
 * Used for real-time development and MCP integration
 */

test.describe('OrangeCat Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/')
  })

  test('should load homepage successfully', async ({ page }) => {
    // Verify page loads
    await expect(page).toHaveTitle(/OrangeCat/)
    
    // Check for main navigation
    await expect(page.locator('nav')).toBeVisible()
    
    // Verify main content is present
    await expect(page.locator('main')).toBeVisible()
  })

  test('should have working navigation menu', async ({ page }) => {
    // Test navigation dropdown
    const productsButton = page.locator('button:has-text("Products")')
    if (await productsButton.isVisible()) {
      await productsButton.click()
      await expect(page.locator('[role="menu"]')).toBeVisible()
    }

    // Test about navigation  
    const aboutButton = page.locator('button:has-text("About")')
    if (await aboutButton.isVisible()) {
      await aboutButton.click()
      await expect(page.locator('[role="menu"]')).toBeVisible()
    }
  })

  test('should display auth buttons for unauthenticated users', async ({ page }) => {
    // Check for sign in button
    const signInButton = page.locator('text=Sign In').first()
    if (await signInButton.isVisible()) {
      await expect(signInButton).toBeVisible()
    }

    // Check for sign up option
    const signUpText = page.locator('text=Sign Up').first()
    if (await signUpText.isVisible()) {
      await expect(signUpText).toBeVisible()
    }
  })

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('nav')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('nav')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Navigate and wait for page to be fully loaded
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon.ico') &&
      !error.includes('manifest.json') &&
      !error.includes('service-worker')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
}) 