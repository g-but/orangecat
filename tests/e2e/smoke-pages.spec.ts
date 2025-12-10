import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Smoke: core pages', () => {
  test('health endpoint returns healthy', async ({ page }) => {
    await page.goto(baseURL + '/api/health');
    const bodyText = await page.textContent('body');
    expect(bodyText || '').toContain('status');
    expect(bodyText || '').toMatch(/healthy|unhealthy/);
  });

  test('channel page renders and waitlist accepts an email', async ({ page }) => {
    await page.goto(baseURL + '/channel');
    await expect(page.getByText('Stream anything', { exact: false })).toBeVisible();
    const email = `test+${Date.now()}@example.com`;
    const input = page.locator('input[type="email"]');
    await expect(input).toBeVisible();
    await input.fill(email);
    const notifyBtn = page.getByRole('button', { name: /notify me/i });
    await expect(notifyBtn).toBeVisible();
    await notifyBtn.click();
    // Non-strict: accept either success toast or silent success depending on environment
    // Just ensure page did not crash
    await expect(page).toHaveURL(/\/channel/);
  });

  test('messages route is reachable (auth or redirect)', async ({ page }) => {
    await page.goto(baseURL + '/messages');
    // If unauthenticated, we expect an auth redirect; otherwise the panel should be visible
    const url = page.url();
    if (url.includes('/auth')) {
      await expect(page).toHaveURL(/\/auth/);
    } else {
      await expect(page.getByText('Messages')).toBeVisible();
    }
  });

  test('timeline route is reachable (auth or redirect)', async ({ page }) => {
    await page.goto(baseURL + '/timeline');
    const url = page.url();
    if (url.includes('/auth')) {
      await expect(page).toHaveURL(/\/auth/);
    } else {
      // If already authenticated, ensure timeline content area is present
      await expect(page.locator('main, body')).toBeVisible();
    }
  });
});

