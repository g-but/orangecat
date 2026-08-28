/**
 * Auth Session Management - Session retrieval, user info, state monitoring
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { Session } from '@supabase/supabase-js';
import type { AuthError } from '../types';

export async function getSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.auth('Failed to get session', { error: error.message });
      return { session: null, error: error as AuthError };
    }

    logger.auth('Session retrieved', { hasSession: !!session, userId: session?.user?.id });
    return { session, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error('Unexpected error getting session', { error: authError.message }, 'Auth');
    return { session: null, error: authError };
  }
}

export async function getUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.auth('Failed to get user', { error: error.message });
      return { user: null, error: error as AuthError };
    }

    logger.auth('User retrieved', { userId: user?.id, email: user?.email });
    return { user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    logger.error('Unexpected error getting user', { error: authError.message }, 'Auth');
    return { user: null, error: authError };
  }
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  logger.auth('Setting up auth state change listener');

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    logger.auth('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id });
    callback(event, session);
  });

  return subscription;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const { user } = await getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Who is reading — the ONE definition, cached for as long as it stays true.
 *
 * `supabase.auth.getUser()` is a network call: it validates the token against
 * `/auth/v1/user`. There were six independent copies of this function across
 * services (timeline, groups, loans, projects, this file), each uncached, so a
 * single page could ask the server who the reader was a dozen times over. On
 * the timeline that lookup also sat on the critical path: it ran after the feed
 * returned and gated the reaction queries, though it depends on neither.
 *
 * Cached as the in-flight PROMISE, not the value, so concurrent callers
 * collapse onto one request instead of racing to make several. A failure is
 * never cached — caching "nobody is signed in" would outlive the blip that
 * caused it and quietly render the app as signed-out.
 *
 * Safe as module state ONLY because this module talks exclusively to the
 * browser client. A server client is per-request, and a module-level identity
 * cache there would hand one request's user to the next.
 */
let cachedUserId: string | null | undefined;
let userIdInFlight: Promise<string | null> | null = null;
let watchingAuth = false;

/**
 * Drop the cached id whenever Supabase says the session changed.
 *
 * Sign-in and sign-out normally replace the page, but "normally" is not a
 * guarantee — token refreshes and same-document auth changes happen too, and an
 * id must never outlive the session it came from.
 *
 * Registered on first use rather than at import. This module is imported very
 * widely, and a subscription that runs at import time is a side effect every
 * importer pays for — including every test that stubs the client.
 */
function watchAuthChanges(): void {
  if (watchingAuth || typeof window === 'undefined') {
    return;
  }
  watchingAuth = true;
  supabase.auth.onAuthStateChange(() => {
    __resetCurrentUserIdCache();
  });
}

export async function getCurrentUserId(): Promise<string | null> {
  watchAuthChanges();
  if (cachedUserId !== undefined) {
    return cachedUserId;
  }
  if (!userIdInFlight) {
    userIdInFlight = (async () => {
      try {
        const { user, error } = await getUser();
        if (error) {
          // getUser() swallows the throw and reports the failure here instead,
          // so this branch is the only thing separating "signed out" from
          // "could not ask". Caching the two the same way would turn one
          // network blip into a signed-out session for the rest of the page.
          return null;
        }
        cachedUserId = user?.id || null;
        return cachedUserId;
      } catch {
        return null;
      } finally {
        userIdInFlight = null;
      }
    })();
  }
  return userIdInFlight;
}

/**
 * Start learning the reader's id without waiting for the answer.
 *
 * For callers that know they will need it later and can overlap the round-trip
 * with work that does not depend on it — fetching a feed, say. Returns nothing,
 * so it cannot be mistaken for the id itself.
 */
export function warmCurrentUserId(): void {
  void getCurrentUserId();
}

/** Test seam, and what the auth listener calls when the reader changes. */
export function __resetCurrentUserIdCache(): void {
  cachedUserId = undefined;
  userIdInFlight = null;
}
