/**
 * Centralized Route Configuration
 *
 * Type-safe route definitions for header visibility logic
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created centralized route config for header logic
 */

export const ROUTES = {
  AUTHENTICATED: [
    '/dashboard',
    '/profile',
    '/settings',
    '/assets',
    '/people',
    '/events',
    '/organizations',
    '/funding',
  ] as const,
} as const;

export type AuthenticatedRoute = (typeof ROUTES.AUTHENTICATED)[number];

/**
 * Check if a pathname matches an authenticated route
 * Uses precise matching to prevent false positives (e.g., '/dashboard-something' won't match '/dashboard')
 */
export function isAuthenticatedRoute(pathname: string): boolean {
  return ROUTES.AUTHENTICATED.some(route => pathname === route || pathname.startsWith(`${route}/`));
}
