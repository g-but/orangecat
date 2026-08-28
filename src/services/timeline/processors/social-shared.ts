/**
 * Shared internals for timeline social interactions (reactions + comments).
 * Extracted verbatim from socialInteractions.ts (SoC). No behavior change.
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';

// TIMELINE_LIKES, TIMELINE_DISLIKES, TIMELINE_COMMENTS are not in the generated DB schema,
// and custom RPCs (like/unlike/comment) are also absent — cast required.
export const db = supabase as any;

/**
 * Who is reading, cached for the page.
 *
 * `supabase.auth.getUser()` is a NETWORK call — it validates the token against
 * `/auth/v1/user`. This is called once per enrichment pass, and enrichment runs
 * once per node while a reply tree is built, so opening a thread fired one
 * round-trip per reply just to re-learn the same id. Measured on a three-reply
 * thread: eight `/auth/v1/user` calls for one page.
 *
 * Cached as the in-flight PROMISE, not the value, so concurrent callers — and
 * enrichment is deliberately concurrent — collapse onto one request instead of
 * racing to make several. Only a resolved id is kept; a failure is not cached,
 * because caching "nobody is signed in" would outlive the blip that caused it
 * and quietly render the whole timeline as signed-out.
 *
 * The id cannot change without a sign-in or sign-out, and both replace the
 * page, so a page-lifetime cache is the correct scope.
 */
let cachedUserId: string | null | undefined;
let userIdInFlight: Promise<string | null> | null = null;

export async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) {
    return cachedUserId;
  }
  if (!userIdInFlight) {
    userIdInFlight = (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        cachedUserId = user?.id || null;
        return cachedUserId;
      } catch (error) {
        logger.error('Error getting current user ID', error, 'Timeline');
        return null;
      } finally {
        userIdInFlight = null;
      }
    })();
  }
  return userIdInFlight;
}

/** Test seam, and the hook a sign-out would use if this ever needs clearing. */
export function __resetCurrentUserIdCache(): void {
  cachedUserId = undefined;
  userIdInFlight = null;
}
