/**
 * Allocation policy service — reads and (after verification) activates the
 * platform policies Solon governs.
 *
 * The safety invariant lives here: activateVersion() refuses any row that has
 * no `verified_at`, and `verified_at` is only ever set by decision-verify
 * after re-verifying every Bitcoin vote signature in the Solon decision
 * document locally. There is no path to an active v2+ policy that bypasses a
 * verified vote. Version 1 (genesis, solon refs NULL) is seeded by the
 * owner-gated scripts/solon/seed-genesis-policy.ts.
 */
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import { ALLOCATION_POLICY_KEY, type AllocationPolicyContent } from '@/config/solon';
import { logger } from '@/utils/logger';

export interface ActiveAllocationPolicy {
  version: number;
  content: AllocationPolicyContent;
}

/**
 * The currently active allocation policy, or null when none exists (pre-genesis)
 * or the read fails. A missing policy means "no platform ceiling yet" — per-user
 * caps still apply; enforcement must not brick payments on a read error.
 */
export async function getActiveAllocationPolicy(
  supabase: AnySupabaseClient,
  policyKey: string = ALLOCATION_POLICY_KEY
): Promise<ActiveAllocationPolicy | null> {
  const { data, error } = await supabase
    .from(DATABASE_TABLES.ALLOCATION_POLICIES)
    .select('version, content')
    .eq('policy_key', policyKey)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    logger.warn('allocation policy read failed — platform ceiling not applied', { error }, 'Solon');
    return null;
  }
  if (!data) {
    return null;
  }
  return { version: data.version, content: data.content as unknown as AllocationPolicyContent };
}

export interface ActivateResult {
  activated: boolean;
  reason?: string;
  version?: number;
}

/**
 * Activate a policy version. Refuses without `verified_at` + `solon_decision_id`
 * — the signed, locally re-verified Solon vote IS the authorization; nothing
 * else is accepted. Supersedes the currently active version of the same key.
 */
export async function activateVersion(
  supabase: AnySupabaseClient,
  policyId: string
): Promise<ActivateResult> {
  const { data: row, error } = await supabase
    .from(DATABASE_TABLES.ALLOCATION_POLICIES)
    .select('id, policy_key, version, status, verified_at, solon_decision_id')
    .eq('id', policyId)
    .maybeSingle();

  if (error || !row) {
    return { activated: false, reason: 'policy version not found' };
  }
  if (row.status === 'active') {
    return { activated: true, version: row.version };
  }
  if (row.status !== 'draft') {
    return { activated: false, reason: `policy version is ${row.status}, only drafts activate` };
  }
  if (!row.verified_at || !row.solon_decision_id) {
    return {
      activated: false,
      reason:
        'refusing to activate without a locally verified Solon decision (verified_at is unset)',
    };
  }

  const { error: supersedeError } = await supabase
    .from(DATABASE_TABLES.ALLOCATION_POLICIES)
    .update({ status: 'superseded' })
    .eq('policy_key', row.policy_key)
    .eq('status', 'active');
  if (supersedeError) {
    return {
      activated: false,
      reason: `failed to supersede current version: ${supersedeError.message}`,
    };
  }

  const { error: activateError } = await supabase
    .from(DATABASE_TABLES.ALLOCATION_POLICIES)
    .update({ status: 'active', activated_at: new Date().toISOString() })
    .eq('id', row.id);
  if (activateError) {
    return { activated: false, reason: `failed to activate: ${activateError.message}` };
  }

  logger.info('allocation policy version activated', { policyId, version: row.version }, 'Solon');
  return { activated: true, version: row.version };
}
