/**
 * Unified Route Configuration
 *
 * Single source of truth for all route categorization and detection logic
 * Eliminates scattered route detection throughout the codebase
 *
 * Created: 2025-12-12
 * Last Modified: 2026-01-30
 * Last Modified Summary: Consolidated all route definitions from headerRoutes.ts and lib/routes.ts into this single source of truth
 */

/**
 * Route contexts categorize routes by their accessibility and purpose
 */
export const ROUTE_CONTEXTS = {
  /**
   * Routes only accessible to authenticated users
   */
  authenticated: [
    '/dashboard',
    '/profile',
    '/settings',
    '/assets',
    '/organizations',
    '/loans',
    '/messages',
    '/timeline',
    '/groups',
    '/funding',
    '/post',
    '/project',
    '/onboarding',
  ] as const,

  /**
   * Routes accessible to everyone, typically landing/marketing pages
   */
  public: [
    '/',
    '/discover',
    '/community',
    '/channel',
    '/browse',
    '/categories',
    '/stories',
    '/events',
    '/technology',
    '/bitcoin-wallet-guide',
    '/study-bitcoin',
    '/how-it-works',
    '/fund-us',
    '/fundraising',
    '/donate',
    '/donations',
    '/pages',
    '/wallets',
  ] as const,

  /**
   * Routes accessible to both authenticated and non-authenticated users
   * These are informational pages that don't require login
   */
  universal: ['/about', '/blog', '/docs', '/privacy', '/terms', '/faq', '/coming-soon'] as const,

  /**
   * Authentication-related routes
   */
  auth: [
    '/auth',
    '/auth/callback',
    '/auth/confirm',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/signout',
  ] as const,

  /**
   * Routes that show different content based on auth state
   * (e.g., profiles show different data for own vs others)
   */
  contextual: ['/profiles'] as const,
} as const;

/**
 * Type definitions for route contexts
 */
export type AuthenticatedRoute = (typeof ROUTE_CONTEXTS.authenticated)[number];
export type PublicRoute = (typeof ROUTE_CONTEXTS.public)[number];
export type UniversalRoute = (typeof ROUTE_CONTEXTS.universal)[number];
export type AuthRoute = (typeof ROUTE_CONTEXTS.auth)[number];
export type ContextualRoute = (typeof ROUTE_CONTEXTS.contextual)[number];

export type RouteContext = 'authenticated' | 'public' | 'universal' | 'auth' | 'contextual';

/**
 * All routes that require authentication to access
 */
export const AUTHENTICATED_ROUTES = [
  ...ROUTE_CONTEXTS.authenticated,
  ...ROUTE_CONTEXTS.contextual,
] as const;

/**
 * All routes that should show navigation (headers, footers, etc.)
 */
export const NAVIGATED_ROUTES = [
  ...ROUTE_CONTEXTS.public,
  ...ROUTE_CONTEXTS.authenticated,
  ...ROUTE_CONTEXTS.universal,
  ...ROUTE_CONTEXTS.auth,
  ...ROUTE_CONTEXTS.contextual,
] as const;

/**
 * Routes that should hide the footer (typically authenticated routes)
 */
export const FOOTER_HIDDEN_ROUTES = [...ROUTE_CONTEXTS.authenticated] as const;

/**
 * Routes that should show the sidebar (authenticated routes)
 */
export const SIDEBAR_VISIBLE_ROUTES = [...ROUTE_CONTEXTS.authenticated] as const;

/**
 * Get the context of a route based on its pathname
 */
export function getRouteContext(pathname: string): RouteContext {
  // Check authenticated routes first (most specific)
  if (
    ROUTE_CONTEXTS.authenticated.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return 'authenticated';
  }

  // Check auth routes
  if (ROUTE_CONTEXTS.auth.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return 'auth';
  }

  // Check universal routes
  if (
    ROUTE_CONTEXTS.universal.some(route => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    return 'universal';
  }

  // Check contextual routes
  if (
    ROUTE_CONTEXTS.contextual.some(route => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    return 'contextual';
  }

  // Check public routes
  if (ROUTE_CONTEXTS.public.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return 'public';
  }

  // Default to public for unknown routes
  return 'public';
}

/**
 * Check if a route requires authentication
 * Legacy function for backward compatibility
 */
export function isAuthenticatedRoute(pathname: string): boolean {
  const context = getRouteContext(pathname);
  return context === 'authenticated' || context === 'contextual';
}

/**
 * Check if a route should show the footer
 */
export function shouldShowFooter(pathname: string): boolean {
  return !FOOTER_HIDDEN_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a route should show the sidebar
 */
export function shouldShowSidebar(pathname: string): boolean {
  return SIDEBAR_VISIBLE_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a route should show navigation (header/footer)
 */
export function shouldShowNavigation(pathname: string): boolean {
  return NAVIGATED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Check if a route is considered "public" (accessible without auth)
 */
export function isPublicRoute(pathname: string): boolean {
  const context = getRouteContext(pathname);
  return context === 'public' || context === 'universal' || context === 'auth';
}

/**
 * Route Constants
 *
 * Centralized route definitions for programmatic route generation.
 * Use these constants instead of hardcoded strings throughout the application.
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  AUTH: '/auth',
  DISCOVER: '/discover',
  STUDY_BITCOIN: '/study-bitcoin',
  COMMUNITY: '/community',
  ABOUT: '/about',
  BLOG: '/blog',
  DOCS: '/docs',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',

  // Project routes
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects/create',
    VIEW: (id: string) => `/projects/${id}`,
    EDIT: (id: string) => `/projects/create?edit=${id}`, // Reuse create page with edit param
  },

  // Dashboard routes
  DASHBOARD: {
    HOME: '/dashboard',
    PROJECTS: '/dashboard/projects',
    ANALYTICS: '/dashboard/analytics',
    INFO: '/dashboard/info',
    PEOPLE: '/dashboard/people',
    WALLETS: '/dashboard/wallets',
    GROUPS: '/dashboard/groups',
    ASSETS: '/dashboard/assets',
    LOANS: '/dashboard/loans',
    ORGANIZATIONS: '/dashboard/organizations',
    EVENTS: '/dashboard/events',
    STORE: '/dashboard/store',
    SERVICES: '/dashboard/services',
    CAUSES: '/dashboard/causes',
  },

  // Profile routes (authenticated - own profile)
  PROFILE: {
    VIEW: (username: string) => `/profile/${username}`,
    SETTINGS: '/profile/settings',
    EDIT: '/dashboard/info',
  },

  // Public profile routes (shareable)
  PROFILES: {
    VIEW: (username: string) => `/profiles/${username}`,
    ME: '/profiles/me',
  },

  // Timeline routes
  TIMELINE: '/timeline',

  // Messages routes
  MESSAGES: '/messages',
  MESSAGE_CONVERSATION: (conversationId: string) => `/messages/${conversationId}`,

  // Settings routes
  SETTINGS: '/settings',
} as const;

/**
 * Legacy routes that redirect to new routes
 */
export const LEGACY_ROUTES = {
  CREATE: '/create', // Redirects to /projects/create
} as const;




