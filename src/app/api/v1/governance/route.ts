/**
 * GET /api/v1/governance — public record of the platform's Solon-governed
 * allocation policies: every version, its content and hash, and the Solon
 * decision that legitimated it (null = genesis bootstrap).
 *
 * Public — the whole point is that the Cat's platform-wide spending leash and
 * its provenance are independently checkable. Version content is what voters
 * signed over (content_hash); the decision itself is verifiable at
 * https://solon.orangecat.ch/api/v1/decisions/<decision_id>.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/api/standardResponse';
import { ALLOCATION_POLICY_KEY, SOLON_BASE_URL_DEFAULT, SOLON_ORG_SLUG } from '@/config/solon';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from(DATABASE_TABLES.ALLOCATION_POLICIES)
      .select(
        'policy_key, version, content, content_hash, status, solon_proposal_id, solon_decision_id, verified_at, activated_at, created_at'
      )
      .eq('policy_key', ALLOCATION_POLICY_KEY)
      .order('version', { ascending: false });

    if (error) {
      logger.error('GET /api/v1/governance failed', { error }, 'Solon');
      return apiError('Governance record unavailable', 'INTERNAL_ERROR', 500);
    }

    const versions = data ?? [];
    return apiSuccess({
      policyKey: ALLOCATION_POLICY_KEY,
      governedBy: {
        system: 'solon',
        organization: SOLON_ORG_SLUG,
        baseUrl: process.env.SOLON_BASE_URL || SOLON_BASE_URL_DEFAULT,
      },
      activeVersion: versions.find(v => v.status === 'active')?.version ?? null,
      versions: versions.map(v => ({
        version: v.version,
        content: v.content,
        contentHash: v.content_hash,
        status: v.status,
        solonProposalId: v.solon_proposal_id,
        solonDecisionId: v.solon_decision_id,
        bootstrap: v.solon_decision_id === null,
        verifiedAt: v.verified_at,
        activatedAt: v.activated_at,
        createdAt: v.created_at,
      })),
    });
  } catch (err) {
    logger.error('GET /api/v1/governance failed', { err }, 'Solon');
    return apiError('Governance record unavailable', 'INTERNAL_ERROR', 500);
  }
}
