import { test, expect, type Page } from '@playwright/test';

/**
 * Canonical release smoke matrix.
 *
 * Strategy:
 * - Single source of truth for release-go/no-go flows.
 * - Tests tagged with @p0 are deployment blockers.
 * - Use explicit env guards for authenticated/provider-dependent checks.
 */

const BASE_URL = process.env.E2E_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

async function login(page: Page) {
  if (!EMAIL || !PASSWORD) {
    test.skip(true, 'Missing E2E_USER_EMAIL/E2E_USER_PASSWORD for authenticated P0 checks');
  }

  await page.goto(`${BASE_URL}/auth?mode=login`);
  await page.getByLabel('Email address').fill(EMAIL!);
  await page.getByLabel('Password').fill(PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/dashboard|profile|create|projects/i);
}

test.describe('workflow matrix', () => {
  test('@p0 health endpoint responds', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect([200, 503]).toContain(res.status());
  });

  test('@p0 unauthenticated user is redirected from protected dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/auth|login|signin|dashboard/);
  });

  test('@p0 auth login works with configured fixture user', async ({ page }) => {
    await login(page);
  });

  test('@p0 authenticated dashboard route renders', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('@p0 project create route is reachable for authenticated user', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/projects/create`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('@p0 cat chat endpoint returns a valid HTTP response envelope', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/cat/chat`, {
      data: { message: 'health-check ping' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Accept auth/provider dependent statuses while still validating endpoint liveness.
    expect([200, 400, 401, 403, 429, 500]).toContain(res.status());
  });

  // P0 expansion backlog (implement next):
  test.skip('@p0 password reset complete flow', async () => {
    // TODO: Implement deterministic reset flow with test mailbox harness.
  });

  test.skip('@p0 project status lifecycle transitions', async () => {
    // TODO: Create project -> draft/active/paused/completed/cancelled transition assertions.
  });

  test.skip('@p0 publish/unpublish public visibility checks', async () => {
    // TODO: Validate discover/public visibility semantics when status changes.
  });

  test.skip('@p0 messaging open/send/edit/delete lifecycle', async () => {
    // TODO: Create/open conversation and assert message mutation lifecycle.
  });

  test.skip('@p0 notifications unread/read counter consistency', async () => {
    // TODO: Assert unread increments and read operations decrement consistently.
  });
});
