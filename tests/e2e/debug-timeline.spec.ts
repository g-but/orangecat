import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const email = process.env.E2E_TEST_USER_EMAIL as string;
const password = process.env.E2E_TEST_USER_PASSWORD as string;

test.describe('Debug Timeline', () => {
  test.beforeAll(() => {
    if (!email || !password) {
      throw new Error('Missing E2E_TEST_USER_EMAIL/E2E_TEST_USER_PASSWORD in environment');
    }
  });

  test('check timeline page structure', async ({ page }) => {
    // Login first
    await page.goto(`${baseURL}/auth?mode=login`);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await page.waitForURL(/\/(dashboard|timeline|onboarding)/, { timeout: 15000 });

    // Navigate to timeline
    await page.goto(`${baseURL}/timeline`);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'screenshots/timeline-debug.png', fullPage: true });

    // Check what elements exist
    const pageContent = await page.textContent('body');
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    console.log('Has "Timeline" text:', pageContent.includes('Timeline'));
    console.log('Has "What\'s happening" text:', pageContent.includes("What's happening"));

    // Check for various composer elements
    const textareaElements = await page.locator('textarea').all();
    console.log('Number of textarea elements:', textareaElements.length);

    for (let i = 0; i < textareaElements.length; i++) {
      const placeholder = await textareaElements[i].getAttribute('placeholder');
      const visible = await textareaElements[i].isVisible();
      console.log(`Textarea ${i}: placeholder="${placeholder}", visible=${visible}`);
    }

    // Check for composer-related text
    const composerText = await page.locator("text=/What's happening|Write on|Compose/i").all();
    console.log('Composer-related text elements:', composerText.length);

    // Check for any input or div with contenteditable
    const contentEditable = await page.locator('[contenteditable]').all();
    console.log('Contenteditable elements:', contentEditable.length);

    // Check the entire page HTML structure (first 2000 chars)
    const html = await page.innerHTML('body');
    console.log('Page HTML preview:', html.substring(0, 2000) + '...');
  });
});
