/**
 * Cat custom instructions — the user's standing instructions for their Cat.
 *
 * One column (`user_ai_preferences.custom_instructions`), one fetch, one
 * injection point (buildCatSystemPrompt). The length ceiling here is the
 * app-side SSOT; the DB CHECK constraint (migration 20260802130000) is the
 * backstop for direct client writes.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';

export const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 2000;

/**
 * Fetch the user's standing instructions, trimmed and length-capped.
 * Best-effort: any failure returns undefined — a missing preference must
 * never break a chat turn.
 */
export async function getCustomInstructions(
  supabase: AnySupabaseClient,
  userId: string
): Promise<string | undefined> {
  try {
    const { data } = await supabase
      .from(DATABASE_TABLES.USER_AI_PREFERENCES)
      .select('custom_instructions')
      .eq('user_id', userId)
      .maybeSingle();
    const raw = (data as { custom_instructions?: string | null } | null)?.custom_instructions;
    const trimmed = raw?.trim();
    return trimmed ? trimmed.slice(0, MAX_CUSTOM_INSTRUCTIONS_LENGTH) : undefined;
  } catch {
    return undefined;
  }
}
