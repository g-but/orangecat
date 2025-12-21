import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Public pages smoke', () => {
  test('Home page loads', async ({ page }) => {
    await page.goto(BASE_URL + '/');
    await expect(page).toHaveTitle(/OrangeCat/i);
  });

  test('Discover loads', async ({ page }) => {
    await page.goto(BASE_URL + '/discover');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Wallets info page loads', async ({ page }) => {
    await page.goto(BASE_URL + '/wallets');
    await expect(page.getByText('Get a Bitcoin Wallet')).toBeVisible();
  });
});

test.describe('Authenticated flows smoke (optional)', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) test.skip(true, 'No TEST_EMAIL/TEST_PASSWORD set');

    await page.goto(BASE_URL + '/auth?mode=login&from=/dashboard');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    const submit = page.getByRole('button', { name: /sign in|login/i });
    if (await submit.isVisible()) await submit.click();
    await page.waitForURL(/dashboard/);
  });

  test('Dashboard wallets page loads', async ({ page }) => {
    await page.goto(BASE_URL + '/dashboard/wallets');
    await expect(page.getByText(/Bitcoin Wallets/i)).toBeVisible();
  });

  test('Assets list loads', async ({ page }) => {
    await page.goto(BASE_URL + '/assets');
    await expect(page.getByText(/Assets/i)).toBeVisible();
  });

  test('Services dashboard loads', async ({ page }) => {
    await page.goto(BASE_URL + '/dashboard/services');
    await expect(page.getByText(/Services/i)).toBeVisible();
  });
});

