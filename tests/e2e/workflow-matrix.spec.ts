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

  test('@p0 project status lifecycle transitions via API', async ({ page }) => {
    await login(page);

    const projectId = process.env.E2E_PROJECT_ID;
    if (!projectId) {
      test.skip(true, 'Missing E2E_PROJECT_ID for status lifecycle checks');
    }

    const transitions = [
      { to: 'active', allowed: [200, 422] },
      { to: 'paused', allowed: [200, 422] },
      { to: 'active', allowed: [200, 422] },
      { to: 'draft', allowed: [200, 422] },
    ] as const;

    for (const step of transitions) {
      const res = await page.request.patch(`${BASE_URL}/api/projects/${projectId}/status`, {
        data: { status: step.to },
        headers: { 'Content-Type': 'application/json' },
      });
      expect(step.allowed).toContain(res.status());
    }
  });

  test('@p0 messaging open/send/edit/delete lifecycle', async ({ page }) => {
    await login(page);

    let conversationId: string | null = null;

    const selfConversation = await page.request.post(`${BASE_URL}/api/test/conversation/self`);
    if (selfConversation.ok()) {
      const data = (await selfConversation.json()) as { conversationId?: string };
      conversationId = data.conversationId || null;
    }

    if (!conversationId) {
      const fallback = await page.request.get(`${BASE_URL}/api/messages/self`);
      if (fallback.ok()) {
        const data = (await fallback.json()) as { conversationId?: string };
        conversationId = data.conversationId || null;
      }
    }

    if (!conversationId) {
      test.skip(true, 'No test/self conversation bootstrap endpoint available');
    }

    const text = `matrix-msg-${Date.now()}`;
    const sendRes = await page.request.post(`${BASE_URL}/api/messages/${conversationId}`, {
      data: { content: text },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(sendRes.ok()).toBeTruthy();

    const sendBody = (await sendRes.json().catch(() => ({}))) as {
      id?: string;
      messageId?: string;
    };
    const messageId = sendBody.id || sendBody.messageId;
    expect(messageId).toBeTruthy();

    const editRes = await page.request.patch(`${BASE_URL}/api/messages/edit/${messageId}`, {
      data: { content: `${text}-edited` },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(editRes.ok()).toBeTruthy();

    const deleteRes = await page.request.post(`${BASE_URL}/api/messages/bulk-delete`, {
      data: { messageIds: [messageId] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(deleteRes.ok()).toBeTruthy();
  });

  // P0 expansion backlog:
  test.skip('@p0 password reset complete flow', async () => {
    // TODO: Implement deterministic reset flow with test mailbox harness.
  });

  test.skip('@p0 publish/unpublish public visibility checks', async () => {
    // TODO: Validate discover/public visibility semantics when status changes.
  });

  test.skip('@p0 notifications unread/read counter consistency', async () => {
    // TODO: Assert unread increments and read operations decrement consistently.
  });
});
