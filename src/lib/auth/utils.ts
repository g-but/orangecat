/**
 * Authentication Utilities
 *
 * Single Source of Truth for authentication state checking and utilities.
 * Ensures consistent auth checks across the entire application.
 *
 * Created: 2026-01-16
 */

import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

/**
 * Check if user is authenticated
 *
 * CRITICAL: Requires BOTH user AND session for true authentication.
 * This prevents showing UI with stale data.
 *
 * @param user - Supabase user object
 * @param session - Supabase session object
 * @returns true if user is fully authenticated
 */
export function isAuthenticated(
  user: SupabaseUser | null | undefined,
  session: Session | null | undefined
): boolean {
  return !!(user && session);
}

/**
 * Check if auth state is ready (hydrated and not loading)
 *
 * @param hydrated - Whether auth state has been hydrated
 * @param isLoading - Whether auth is currently loading
 * @returns true if auth state is ready to check
 */
export function isAuthReady(hydrated: boolean, isLoading: boolean): boolean {
  return hydrated && !isLoading;
}

/**
 * Auth state for consistent checking across components
 */
export interface AuthState {
  /** Supabase user object */
  user: SupabaseUser | null;
  /** Supabase session object */
  session: Session | null;
  /** Whether auth state is loading */
  isLoading: boolean;
  /** Whether auth state has been hydrated from storage */
  hydrated: boolean;
  /** Authentication error if any (can originate as string from store) */
  authError?: unknown | null;
}

/**
 * Get authentication status from auth state
 *
 * @param state - Auth state object
 * @returns Authentication status object
 */
export function getAuthStatus(state: AuthState) {
  const ready = isAuthReady(state.hydrated, state.isLoading);
  const authenticated = isAuthenticated(state.user, state.session);

  return {
    /** Whether auth state is ready to check */
    ready,
    /** Whether user is authenticated */
    authenticated,
    /** Whether to show loading state */
    showLoading: !ready,
    /** Whether there's an auth error */
    hasError: !!state.authError,
  };
}
