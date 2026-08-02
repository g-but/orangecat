/**
 * Shared internals for timeline social interactions (reactions + comments).
 * Extracted verbatim from socialInteractions.ts (SoC). No behavior change.
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';

// TIMELINE_LIKES, TIMELINE_DISLIKES, TIMELINE_COMMENTS are not in the generated DB schema,
// and custom RPCs (like/unlike/comment) are also absent — cast required.
export const db = supabase as any;

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user ID', error, 'Timeline');
    return null;
  }
}
