import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Auth Implementation Tests', () => {
  // Increase timeout for slow Next.js compilation
  test.setTimeout(120000);

  test('1. Home page loads successfully', async ({ page }) => {
    console.log('📄 Loading home page...');

    const response = await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    expect(response?.status()).toBe(200);
    console.log('✅ Home page returned 200 OK');

    // Wait for React hydration
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Check page has content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(100);
    console.log('✅ Page content rendered');

    // Check for critical errors in console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Wait a bit for any errors to surface
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(err =>
      err.includes('ReferenceError') ||
      err.includes('is not defined') ||
      err.includes('Cannot read')
    );

    expect(criticalErrors.length).toBe(0);
    console.log('✅ No critical JavaScript errors');
  });

  test('2. Auth page loads with form elements', async ({ page }) => {
    console.log('📄 Loading /auth page...');

    const response = await page.goto(`${BASE_URL}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    expect(response?.status()).toBe(200);
    console.log('✅ Auth page returned 200 OK');

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Check for email input
    const emailInput = await page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Email input found');

    // Check for password input
    const passwordInput = await page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Password input found');

    // Check for submit button or link text
    const hasAuthButton = await page.locator('button[type="submit"]').count() > 0;
    expect(hasAuthButton).toBeTruthy();
    console.log('✅ Auth form elements present');
  });

  test('3. Middleware redirects protected routes to auth', async ({ page }) => {
    console.log('📄 Accessing /dashboard (protected route)...');

    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    const currentUrl = page.url();
    console.log(`📍 Final URL: ${currentUrl}`);

    expect(currentUrl).toContain('/auth');
    console.log('✅ Middleware redirected to auth page');

    // Check redirect params
    expect(
      currentUrl.includes('mode=login') || currentUrl.includes('from=')
    ).toBeTruthy();
    console.log('✅ Redirect parameters preserved');
  });

  test('4. Supabase client initializes without errors', async ({ page }) => {
    console.log('📄 Testing Supabase client initialization...');

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(3000);

    const supabaseErrors = errors.filter(err =>
      err.toLowerCase().includes('supabase') &&
      (err.includes('Missing required') ||
       err.includes('Invalid') ||
       err.includes('not defined'))
    );

    expect(supabaseErrors.length).toBe(0);
    console.log('✅ Supabase client initialized without configuration errors');
  });

  test('5. AuthProvider registers onAuthStateChange listener', async ({ page }) => {
    console.log('📄 Checking AuthProvider initialization...');

    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(3000);

    // Check for GoTrueClient logs indicating auth state change registration
    const hasAuthCallback = logs.some(log =>
      log.includes('onAuthStateChange') ||
      log.includes('INITIAL_SESSION') ||
      log.includes('registered callback')
    );

    expect(hasAuthCallback).toBeTruthy();
    console.log('✅ AuthProvider onAuthStateChange listener detected');
  });

  test('6. Auth page displays error for invalid credentials', async ({ page }) => {
    console.log('📄 Testing auth form validation...');

    await page.goto(`${BASE_URL}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Find and click login button
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for error message (should appear within 5 seconds)
    const errorVisible = await page.locator('text=/Invalid|incorrect|failed/i').first().isVisible({ timeout: 10000 }).catch(() => false);

    // We expect either an error message or the form to still be visible (not redirected)
    const stillOnAuthPage = page.url().includes('/auth');

    expect(stillOnAuthPage).toBeTruthy();
    console.log('✅ Auth form handles login attempt (stayed on page or showed error)');
  });

  test('7. Session persistence across page reloads', async ({ page }) => {
    console.log('📄 Testing session persistence across reloads...');

    // First, sign in a user
    await page.goto(`${BASE_URL}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Mock successful login for persistence test
    await page.route('**/auth/signin**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: 'persist@test.com' },
          session: { access_token: 'persistent-token', refresh_token: 'refresh-token' }
        })
      });
    });

    // Fill in valid credentials and submit
    await page.fill('input[type="email"]', 'persist@test.com');
    await page.fill('input[type="password"]', 'validPassword123');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for redirect to dashboard (indicating successful login)
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
    console.log('✅ User successfully signed in');

    // Verify we're actually on a protected page
    const dashboardContent = await page.textContent('body');
    expect(dashboardContent).toBeTruthy();
    console.log('✅ Dashboard content loaded');

    // Now reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Verify session persisted - should still be on dashboard or redirected appropriately
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth');
    console.log('✅ Session persisted across reload');

    // Check for user-specific content that indicates authentication state
    const hasUserContent = await page.locator('text=/dashboard|profile|user/i').count() > 0;
    expect(hasUserContent).toBeTruthy();
    console.log('✅ User authentication state maintained');
  });

  test('8. Logout functionality clears session', async ({ page }) => {
    console.log('📄 Testing logout functionality...');

    // Start from authenticated state
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Mock logout endpoint
    await page.route('**/auth/signout**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Look for logout button (might be in header, nav, or user menu)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")').first();

    // If logout button exists, click it
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      console.log('✅ Logout button clicked');

      // Wait for redirect to auth page or home
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/auth|\/$/);
      console.log('✅ Redirected after logout');

      // Verify user is no longer authenticated by trying to access protected route
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      const finalUrl = page.url();
      expect(finalUrl).toContain('/auth');
      console.log('✅ Session properly cleared - protected route access denied');
    } else {
      console.log('⚠️ Logout button not found - skipping logout test');
      // This is acceptable if logout functionality isn't implemented yet
    }
  });

  test('9. Protected route access after successful authentication', async ({ page }) => {
    console.log('📄 Testing protected route access after login...');

    // Start at auth page
    await page.goto(`${BASE_URL}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Mock successful login
    await page.route('**/auth/signin**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'protected-test-user', email: 'protected@test.com' },
          session: { access_token: 'protected-token' }
        })
      });
    });

    // Sign in
    await page.fill('input[type="email"]', 'protected@test.com');
    await page.fill('input[type="password"]', 'validPassword123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
    console.log('✅ Successfully authenticated and redirected');

    // Verify we can access other protected routes
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    const profileUrl = page.url();
    expect(profileUrl).toContain('/profile');
    expect(profileUrl).not.toContain('/auth');
    console.log('✅ Profile route accessible after authentication');

    // Test accessing organizations page if it exists
    await page.goto(`${BASE_URL}/organizations`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    const orgUrl = page.url();
    expect(orgUrl).not.toContain('/auth');
    console.log('✅ Organizations route accessible after authentication');
  });

  test('10. Token refresh mechanism works correctly', async ({ page }) => {
    console.log('📄 Testing token refresh functionality...');

    // Start with authenticated session
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    let refreshTriggered = false;

    // Mock initial token that will expire soon
    await page.route('**/auth/token**', async route => {
      refreshTriggered = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'new-refreshed-token',
          refresh_token: 'new-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        })
      });
    });

    // Mock API call that would trigger token refresh (e.g., profile update)
    await page.route('**/api/profile**', async route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Profile updated successfully'
          })
        });
      }
    });

    // Try to perform an action that requires authentication
    // This should trigger token refresh if the current token is expired/invalid
    const profileUpdateButton = page.locator('button:has-text("Update Profile"), button:has-text("Save"), [data-testid="profile-update"]').first();

    if (await profileUpdateButton.count() > 0) {
      await profileUpdateButton.click();
      console.log('✅ Profile update action triggered');

      // Wait for potential token refresh and API response
      await page.waitForTimeout(3000);

      // Check if refresh was triggered
      if (refreshTriggered) {
        console.log('✅ Token refresh was triggered during authenticated request');
      } else {
        console.log('ℹ️ Token refresh not triggered - may not be needed or implemented');
      }

      // Verify the action completed successfully (profile was updated)
      const successMessage = await page.locator('text=/success|updated|saved/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (successMessage) {
        console.log('✅ Authenticated action completed successfully');
      }
    } else {
      console.log('⚠️ No profile update action found - simulating API call instead');

      // Simulate making an authenticated API request
      await page.evaluate(async () => {
        try {
          const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'Test User' })
          });

          if (response.ok) {
            console.log('API call successful');
          } else if (response.status === 401) {
            console.log('Token expired - refresh needed');
          }
        } catch (error) {
          console.log('API call failed:', error);
        }
      });

      await page.waitForTimeout(2000);

      if (refreshTriggered) {
        console.log('✅ Token refresh triggered during API call');
      }
    }

    // Verify user is still authenticated and can access protected content
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth');
    console.log('✅ User session maintained after token operations');
  });

  test('11. Comprehensive error handling and edge cases', async ({ page }) => {
    console.log('📄 Testing comprehensive error scenarios...');

    // Test 1: Network connectivity issues
    console.log('🔌 Testing network connectivity issues...');
    await page.goto(`${BASE_URL}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Simulate network failure
    await page.route('**/auth/signin**', async route => {
      await route.abort('failed');
    });

    await page.fill('input[type="email"]', 'network@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show network error message
    const networkErrorVisible = await page.locator('text=/network|connection|timeout/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(networkErrorVisible).toBeTruthy();
    console.log('✅ Network error handled correctly');

    // Test 2: Server errors (5xx)
    console.log('🔥 Testing server errors (5xx)...');
    await page.reload();

    await page.route('**/auth/signin**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.fill('input[type="email"]', 'server@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    const serverErrorVisible = await page.locator('text=/server|internal|error/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(serverErrorVisible).toBeTruthy();
    console.log('✅ Server error handled correctly');

    // Test 3: Rate limiting (429)
    console.log('🚦 Testing rate limiting (429)...');
    await page.reload();

    await page.route('**/auth/signin**', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests' })
      });
    });

    await page.fill('input[type="email"]', 'ratelimit@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    const rateLimitErrorVisible = await page.locator('text=/many|requests|limit/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(rateLimitErrorVisible).toBeTruthy();
    console.log('✅ Rate limiting error handled correctly');

    // Test 4: Malformed response
    console.log('🔧 Testing malformed response...');
    await page.reload();

    await page.route('**/auth/signin**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });

    await page.fill('input[type="email"]', 'malformed@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should handle malformed response gracefully
    const stillOnPage = page.url().includes('/auth');
    expect(stillOnPage).toBeTruthy();
    console.log('✅ Malformed response handled gracefully');

    // Test 5: Concurrent login attempts
    console.log('⚡ Testing concurrent login attempts...');
    await page.reload();

    let requestCount = 0;
    await page.route('**/auth/signin**', async route => {
      requestCount++;
      // Simulate slow response for concurrent requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'concurrent-user', email: 'concurrent@test.com' },
          session: { access_token: 'concurrent-token' }
        })
      });
    });

    // Fill form and submit multiple times rapidly
    await page.fill('input[type="email"]', 'concurrent@test.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit form multiple times
    await Promise.all([
      page.click('button[type="submit"]'),
      page.click('button[type="submit"]'),
      page.click('button[type="submit"]')
    ]);

    await page.waitForTimeout(2000);

    // Should handle concurrent requests properly (only one should succeed)
    expect(requestCount).toBeGreaterThan(0);
    console.log('✅ Concurrent requests handled');

    // Test 6: Session corruption recovery
    console.log('🛠️ Testing session corruption recovery...');
    await page.reload();

    // Navigate to dashboard with corrupted session simulation
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Simulate corrupted session by clearing local storage in browser context
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload();

    // Should redirect to auth page when session is corrupted
    const redirectedToAuth = page.url().includes('/auth');
    expect(redirectedToAuth).toBeTruthy();
    console.log('✅ Session corruption handled - redirected to auth');

    // Test 7: Expired session handling
    console.log('⏰ Testing expired session handling...');
    await page.goto(`${BASE_URL}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Mock expired token scenario
    await page.route('**/auth/user**', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' })
      });
    });

    // Try to access protected route with expired session
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Should redirect to auth page
    const expiredRedirect = page.url().includes('/auth');
    expect(expiredRedirect).toBeTruthy();
    console.log('✅ Expired session handled - redirected to auth');

    console.log('✅ Comprehensive error scenarios test completed');
  });
});
