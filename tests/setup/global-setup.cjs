// Playwright global setup to pre-authenticate and save storage state for tests.
// Requires environment variables: E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD.
// If credentials are missing or login fails, setup falls back gracefully (no storageState).

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

module.exports = async () => {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const email = process.env.E2E_TEST_USER_EMAIL || process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD || process.env.E2E_USER_PASSWORD;

  const authDir = path.resolve(__dirname, '..', '.auth');
  const storagePath = path.join(authDir, 'user.json');

  // Ensure auth directory exists
  fs.mkdirSync(authDir, { recursive: true });

  if (!email || !password) {
    console.warn('[global-setup] Missing E2E_TEST_USER_EMAIL/E2E_TEST_USER_PASSWORD; skipping pre-auth.');
    return;
  }

  console.log('[global-setup] Starting login flow to create storage state...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${baseURL}/auth?mode=login`, { waitUntil: 'networkidle' });

    // Fill login form and submit
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    const submit = page.getByRole('button', { name: /sign in|log in|login/i });
    await submit.click();

    // Wait for a successful redirect to an authenticated route
    await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 15000 });
    console.log('[global-setup] Login success. Saving storage state...');

    await page.context().storageState({ path: storagePath });
    console.log(`[global-setup] Storage state saved to ${storagePath}`);
  } catch (err) {
    console.warn('[global-setup] Login failed or app not running. Proceeding without storageState.');
    console.warn(err?.message || err);
  } finally {
    await browser.close();
  }
};

