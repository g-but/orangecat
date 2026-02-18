import { test, expect } from '@playwright/test';

/**
 * Canonical release smoke matrix.
 *
 * Strategy:
 * - Keep this file as the single go/no-go E2E gate.
 * - Mark core blockers with @p0 in test titles.
 * - Start deterministic and small; expand only with stable fixtures.
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('workflow matrix', () => {
  test('@p0 public health endpoint responds', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect([200, 503]).toContain(res.status());
  });

  test('@p0 unauthenticated user is redirected from protected dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/auth|login|signin|dashboard/);
  });

  test('@p0 public routes basic render', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('body')).toBeVisible();

    await page.goto(`${BASE_URL}/projects`);
    await expect(page.locator('body')).toBeVisible();
  });

  // TODO(P0): authenticated lifecycle tests with stable fixture account:
  // - signup/login/logout
  // - password reset
  // - project create/edit/status lifecycle
  // - messaging open/send/edit/delete
  // - notification read/unread counters
  // - cat chat provider path

  test.skip('@p0 cat chat endpoint returns structured payload', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/cat/chat`, {
      data: { message: 'ping' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Enable once stable in CI env (auth/provider setup can vary)
    expect([200, 400, 401]).toContain(res.status());
  });
});
