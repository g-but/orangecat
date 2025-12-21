import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  '/profiles', // Public profile pages (shareable)
  '/projects', // Public project listing (redirects to discover)
  '/funding', // Public funding information
  '/onboarding', // Public onboarding flow
];

// Routes that should redirect to /auth if user is not logged in
// Note: /profiles/ is public, /profile/ is protected (own profile)
const protectedRoutes = ['/dashboard', '/profile/', '/settings', '/loans', '/circles', '/assets', '/timeline', '/messages', '/projects/create'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const url = request.nextUrl;

  // Early return for static assets and API routes (handled by matcher, but double-check)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add pathname to headers so layout can access it
  response.headers.set('x-pathname', pathname);

  // Handle Supabase code exchange links (?code=...) - early return for performance
  if (url.searchParams.has('code') && pathname === '/') {
    const callbackUrl = new URL('/auth/callback', request.url);
    url.searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value));
    return NextResponse.redirect(callbackUrl);
  }

  // Optimized password reset flow check
  const searchParams = url.searchParams;
  const hash = url.hash;
  const hasResetTokens =
    searchParams.has('access_token') ||
    searchParams.has('refresh_token') ||
    (hash && hash.includes('access_token'));
  const isRecoveryType =
    searchParams.get('type') === 'recovery' || (hash && hash.includes('type=recovery'));
  const hasAuthErrors =
    searchParams.has('error') ||
    searchParams.has('error_code') ||
    (hash && hash.includes('error='));

  if (
    ((hasResetTokens && isRecoveryType) || hasAuthErrors) &&
    pathname !== '/auth/reset-password'
  ) {
    const resetUrl = new URL('/auth/reset-password', request.url);
    searchParams.forEach((value, key) => resetUrl.searchParams.set(key, value));
    if (hash) {
      resetUrl.hash = hash;
    }
    return NextResponse.redirect(resetUrl);
  }

  // Optimized auth check - only check cookies if accessing protected route
  // Exclude public routes first
  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  const isProtectedRoute =
    !isPublicRoute && protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Validate token with Supabase to avoid stale/forged cookies passing through
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('mode', 'login');
      redirectUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    const tokenFromCookies =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase-auth-token')?.value ||
      request.cookies.get('supabase.auth.token')?.value;

    if (!tokenFromCookies) {
      // In development we rely on client-side Supabase session (localStorage), so allow through
      if (process.env.NODE_ENV !== 'development') {
        const redirectUrl = new URL('/auth', request.url);
        redirectUrl.searchParams.set('mode', 'login');
        redirectUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }

    const { data, error } = await supabase.auth.getUser(tokenFromCookies);
    if (error || !data.user) {
      if (process.env.NODE_ENV !== 'development') {
        const redirectUrl = new URL('/auth', request.url);
        redirectUrl.searchParams.set('mode', 'login');
        redirectUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }
  }

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
