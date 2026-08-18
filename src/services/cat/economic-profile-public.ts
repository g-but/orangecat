/**
 * Public-facing economic-profile read — the only accessor safe to use for a
 * viewer who might not be the profile's owner. Split out from
 * economic-profile.ts to keep that file under its service-file line budget
 * (.claude/rules/code-quality.md); the two stayed one file at first because
 * the type they share is trivially derived, but the accessor itself has
 * nothing to do with the private read/write/extraction logic there.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import type { EconomicSkill, EconomicAsset, PublicEconomicProfile } from './economic-profile';

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * The public-facing slice only — served from user_economic_profile_public,
 * which the RLS policies on the base table cannot expose to a visitor who
 * isn't the owner. Use this (never getEconomicProfile) anywhere a profile is
 * rendered for someone who might not be its owner, e.g. the public profile
 * page.
 */
export async function getPublicEconomicProfile(
  supabase: AnySupabaseClient,
  userId: string
): Promise<PublicEconomicProfile | null> {
  try {
    const { data, error } = await supabase
      .from(DATABASE_TABLES.USER_ECONOMIC_PROFILE_PUBLIC)
      .select('skills, assets, asked_for, not_available_for')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      logger.warn('getPublicEconomicProfile query failed', { error }, 'EconomicProfile');
      return null;
    }
    if (!data) {
      return null;
    }
    const row = data as Record<string, unknown>;
    return {
      skills: asArray<EconomicSkill>(row.skills),
      assets: asArray<EconomicAsset>(row.assets),
      askedFor: asArray<string>(row.asked_for),
      notAvailableFor: asArray<string>(row.not_available_for),
    };
  } catch (err) {
    logger.warn('getPublicEconomicProfile failed', { err: String(err) }, 'EconomicProfile');
    return null;
  }
}
