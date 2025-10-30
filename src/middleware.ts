import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require auth
const publicRoutes = [
  '/',
  '/auth',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/about',
  '/blog',
];

// Routes that should redirect to /auth if user is not logged in
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add pathname to headers so layout can access it
  response.headers.set('x-pathname', request.nextUrl.pathname);

  // Handle password reset flow - redirect from root with reset tokens or error params to reset page
  const url = new URL(request.url);

  // Handle Supabase code exchange links (?code=...) by redirecting to /auth/callback
  if (url.searchParams.has('code') && url.pathname === '/') {
    const callbackUrl = new URL('/auth/callback', request.url);
    url.searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value));
    return NextResponse.redirect(callbackUrl);
  }
  const hasResetTokens =
    url.searchParams.has('access_token') ||
    url.searchParams.has('refresh_token') ||
    url.hash.includes('access_token');
  const isRecoveryType =
    url.searchParams.get('type') === 'recovery' || url.hash.includes('type=recovery');
  // Supabase may redirect with only error params when the link is expired/invalid
  const hasAuthErrors =
    url.searchParams.has('error') ||
    url.searchParams.has('error_code') ||
    url.hash.includes('error=');

  if (
    ((hasResetTokens && isRecoveryType) || hasAuthErrors) &&
    url.pathname !== '/auth/reset-password'
  ) {
    // Redirect to reset password page while preserving all query params and hash
    const resetUrl = new URL('/auth/reset-password', request.url);

    // Copy all query parameters
    url.searchParams.forEach((value, key) => {
      resetUrl.searchParams.set(key, value);
    });

    // Also preserve hash if present (Supabase v2 may use hash for tokens)
    if (url.hash) {
      resetUrl.hash = url.hash;
    }

    return NextResponse.redirect(resetUrl);
  }

  try {
    // Check for authentication by looking for Supabase auth cookies
    // This is Edge Runtime compatible
    const allCookies = Array.from(request.cookies.getAll());

    // Check for the specific Supabase auth token cookie pattern
    const supabaseAuthCookie = allCookies.find(
      cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    );

    // Also check for legacy formats
    const accessToken =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase-auth-token')?.value ||
      request.cookies.get('supabase.auth.token')?.value ||
      supabaseAuthCookie?.value;

    // More comprehensive check for any Supabase auth cookies
    const hasAuthCookie =
      !!supabaseAuthCookie ||
      !!accessToken ||
      allCookies.some(
        cookie =>
          cookie.name.includes('supabase') &&
          cookie.name.includes('auth') &&
          cookie.value &&
          cookie.value.length > 10
      );

    // Extract the path from the URL
    const path = request.nextUrl.pathname;

    // If user is not authenticated and trying to access a protected route, redirect to /auth
    if (!accessToken && !hasAuthCookie && protectedRoutes.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('mode', 'login');
      redirectUrl.searchParams.set('from', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Let client-side handle auth page redirects to avoid loops
    // The auth page will redirect on the client side after hydration
    // if ((accessToken || hasAuthCookie) && path === '/auth') {
    //   return NextResponse.redirect(new URL('/dashboard', request.url))
    // }
  } catch (error) {}

  return response;
}

// Only run middleware on routes that need authentication checks
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - .*\\..* (files with extensions)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api|.*\\..*).*)',
  ],
};
