import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_USER_EMAIL || 'test@orangecat.ch'
const PASSWORD = process.env.E2E_USER_PASSWORD || 'TestPassword123!'

test.describe('Authentication flows', () => {
  test('Login page loads and allows navigation to register and forgot password', async ({ page }) => {
    await page.goto('/auth?mode=login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await page.getByRole('link', { name: 'Forgot your password?' }).click()
    await expect(page.getByText('Reset Your Password')).toBeVisible()
    await page.goBack()
    await page.getByRole('button', { name: 'Create an account' }).click()
    await expect(page.getByText('Create your OrangeCat account')).toBeVisible()
  })

  test('Registration shows errors for invalid email and weak password', async ({ page }) => {
    await page.goto('/auth?mode=register')
    await page.getByLabel('Email address').fill('invalid')
    await page.getByLabel('Password').fill('123')
    await page.getByLabel('Confirm Password').fill('1234')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText(/valid email|Password must/i)).toBeVisible()
  })

  test('Login with existing user (if configured)', async ({ page }) => {
    test.skip(!process.env.E2E_USER_EMAIL, 'No E2E user configured')
    await page.goto('/auth?mode=login')
    await page.getByLabel('Email address').fill(EMAIL)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/dashboard|profile|create/)
  })

  test('Forgot password request shows success and email hint', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await page.getByLabel('Enter your email address').fill(EMAIL)
    await page.getByRole('button', { name: 'Send Reset Instructions' }).click()
    await expect(page.getByText('Check Your Email')).toBeVisible()
  })
})


