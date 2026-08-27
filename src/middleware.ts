import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getRouteSurface, ROUTES } from '@/config/routes';
import { SITES_PATH_PREFIX, siteSlugForHost } from '@/config/sites';

// Edge middleware route classification reads from the SAME SSOT used by
// AppShell / MobileBottomNav / Footer / Header (src/config/routes.ts).
// Never keep a parallel list here — they will drift.
//
// Routes whose surface is 'app' AND which are not also accessible
// signed-out (i.e. require a logged-in user to make any sense) get the
// token validation pass below. Hybrid in-app surfaces like /discover,
// /products, /services, /events stay open to anonymous users and the
// per-page auth gate handles redirect when needed.
const REQUIRES_AUTH_PREFIXES = [
  '/dashboard',
  '/settings',
  '/timeline',
  '/messages',
  '/post',
  '/ai-chat',
  '/profile/', // own profile (note trailing slash — public is at /profiles)
];

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

  // Hosted sites (src/config/sites.ts): a request arriving on a site's own
  // host is somebody else's website, so rewrite it onto /sites/<slug> and let
  // that standalone layout answer. Rewrite, not redirect — the visitor's URL
  // bar must keep saying substrata.orangecat.ch, which is the entire point of
  // what /domains sells. Requests already on /sites/... pass through, so the
  // path form stays previewable from any host.
  //
  // `siteSlugForHost` matches by SHAPE and never touches the database — this
  // runs on every request to the entire app. Whether a site is actually
  // published is decided by the page, which is allowed to query. An unclaimed
  // slug therefore rewrites and then 404s, which is the safe direction.
  const siteSlug = siteSlugForHost(request.headers.get('host'));
  if (siteSlug && !pathname.startsWith(`${SITES_PATH_PREFIX}/`)) {
    const target = request.nextUrl.clone();
    target.pathname = `${SITES_PATH_PREFIX}/${siteSlug}${pathname === '/' ? '' : pathname}`;

    // These go on the REQUEST headers, not just the response.
    //
    // A rewrite keeps the visitor's URL bar saying substrata.orangecat.ch,
    // which means `usePathname()` in the app says "/" — so the layout cannot
    // tell it is rendering somebody else's website by looking at the path. It
    // has to be told. Setting these only on the response (which is what this
    // did first) tells the browser and nothing else, and the result was
    // OrangeCat's header, analytics and Organization schema all rendering on a
    // customer's domain.
    const forwarded = new Headers(request.headers);
    forwarded.set('x-pathname', target.pathname);
    forwarded.set('x-hosted-site', siteSlug);

    const rewritten = NextResponse.rewrite(target, { request: { headers: forwarded } });
    rewritten.headers.set('x-pathname', target.pathname);
    rewritten.headers.set('x-hosted-site', siteSlug);
    return rewritten;
  }

  // Same reasoning as the rewrite above: the layout reads `x-pathname` from the
  // REQUEST, so it has to be set there and not only echoed to the browser.
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({
    request: {
      headers: forwardedHeaders,
    },
  });

  // Add pathname to headers so layout can access it
  response.headers.set('x-pathname', pathname);

  // Handle Supabase code exchange links (?code=...) - early return for performance
  if (url.searchParams.has('code') && pathname === '/') {
    const callbackUrl = new URL(ROUTES.AUTH_CALLBACK, request.url);
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
    pathname !== ROUTES.AUTH_RESET_PASSWORD
  ) {
    const resetUrl = new URL(ROUTES.AUTH_RESET_PASSWORD, request.url);
    searchParams.forEach((value, key) => resetUrl.searchParams.set(key, value));
    if (hash) {
      resetUrl.hash = hash;
    }
    return NextResponse.redirect(resetUrl);
  }

  // Skip token validation on 'public' and 'auth' surfaces — those are
  // intentionally open. Hybrid in-app surfaces (discover, products, …)
  // resolve as 'app' but aren't in REQUIRES_AUTH_PREFIXES, so they also
  // pass through. Only routes that require a logged-in user to make any
  // sense get the cookie-token validation pass.
  const isAppSurface = getRouteSurface(pathname) === 'app';
  const isProtectedRoute =
    isAppSurface && REQUIRES_AUTH_PREFIXES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Validate session with @supabase/ssr — same pattern as
    // src/lib/supabase/server.ts. The old code grepped for cookie
    // names ('sb-access-token', 'supabase-auth-token',
    // 'supabase.auth.token') that @supabase/ssr has never written —
    // its actual cookie key is 'sb-<project-ref>-auth-token' (often
    // chunked '.0', '.1'). Result: the protected-route guard never
    // found a token and always fell through, leaving page-level
    // useRequireAuth as the only real gate.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Misconfigured deployment — bounce to auth rather than crash.
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('mode', 'login');
      redirectUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // getUser() validates the token AND refreshes it if needed. The
    // setAll cookies callback above writes any refreshed token onto
    // the response cookies, so the browser sees the new value on the
    // next request.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('mode', 'login');
      redirectUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(redirectUrl);
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
