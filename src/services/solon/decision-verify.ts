/**
 * Decision verification — the edge where Solon governance becomes OrangeCat
 * reality. "Verifiable, not trusted": the decision document is evidence, and
 * this module re-establishes every claim locally before anything activates:
 *
 *   1. every vote signature is re-verified with OrangeCat's own crypto,
 *   2. voters must be in the locally pinned trusted-key set (solon_trusted_keys)
 *      — and their WEIGHTS come from the pinned rows, not the document,
 *   3. each signed message is re-derived (session + choice + voter binding),
 *   4. the tally and outcome are recomputed from those verified votes,
 *   5. the content hash is re-computed from the proposed content.
 *
 * Only then does the policy version get `verified_at` and activate. Activation
 * is automatic after verification: the signed vote IS the human legitimation —
 * an admin veto after the vote would make voting decorative.
 */
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  ALLOCATION_POLICY_KEY,
  SOLON_BASE_URL_DEFAULT,
  SOLON_ORG_ID,
  type AllocationPolicyContent,
} from '@/config/solon';
import { contentHashOf } from '@/services/solon/canonical';
import { solonVoteMessage, verifyBitcoinMessage } from '@/services/solon/bitcoin-message';
import { activateVersion } from '@/services/solon/allocation-policy';
import { logger } from '@/utils/logger';

export interface DecisionApplyResult {
  applied: boolean;
  reason?: string;
  version?: number;
}

interface DecisionDocument {
  decision_id: string;
  organization: { id: string; slug: string };
  proposal: {
    policyKey: string | null;
    proposedContent: unknown;
    contentHash: string | null;
    target: string | null;
  };
  rules: { threshold: string; quorumPercent: number };
  votes: {
    member: { bitcoinAddress: string };
    choice: 'YES' | 'NO' | 'ABSTAIN';
    signedMessage: string;
    signature: string;
  }[];
  outcome: 'APPROVED' | 'REJECTED' | 'EXPIRED' | null;
}

const SUPERMAJORITY_FRACTION = 2 / 3;

/**
 * Decision ids are Solon session UUIDs. The id can arrive from an
 * HMAC-verified but still external webhook payload, so it must never reach a
 * URL (or a query) unvalidated — anything non-UUID is rejected outright.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fetch a decision document from Solon. Exported for tests to mock. */
export async function fetchDecisionDocument(decisionId: string): Promise<DecisionDocument> {
  const base = process.env.SOLON_BASE_URL || SOLON_BASE_URL_DEFAULT;
  const res = await fetch(`${base}/api/v1/decisions/${encodeURIComponent(decisionId)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Solon decision fetch failed: HTTP ${res.status}`);
  }
  return (await res.json()) as DecisionDocument;
}

/**
 * Verify a finalized Solon decision end-to-end and, if it approves a new
 * allocation policy, record and activate the next version. Idempotent: a
 * decision already applied returns without touching anything.
 */
export async function verifyAndApplyDecision(
  supabase: AnySupabaseClient,
  decisionId: string,
  options: { fetchDocument?: (id: string) => Promise<DecisionDocument> } = {}
): Promise<DecisionApplyResult> {
  if (!UUID_RE.test(decisionId)) {
    return { applied: false, reason: 'decision id is not a UUID' };
  }

  // Idempotency first — a webhook may ring twice, the cron may overlap it.
  const { data: existing } = await supabase
    .from(DATABASE_TABLES.ALLOCATION_POLICIES)
    .select('id, version, status')
    .eq('solon_decision_id', decisionId)
    .maybeSingle();
  if (existing && (existing.status === 'active' || existing.status === 'superseded')) {
    return { applied: true, version: existing.version, reason: 'already applied' };
  }

  let doc: DecisionDocument;
  try {
    doc = await (options.fetchDocument ?? fetchDecisionDocument)(decisionId);
  } catch (e) {
    return { applied: false, reason: e instanceof Error ? e.message : 'decision fetch failed' };
  }

  // --- What is this decision about, and is it ours? ---
  if (doc.organization?.id !== SOLON_ORG_ID) {
    return { applied: false, reason: 'decision belongs to a different organization' };
  }
  if (doc.proposal?.policyKey !== ALLOCATION_POLICY_KEY) {
    return {
      applied: false,
      reason: `not an ${ALLOCATION_POLICY_KEY} decision — nothing to apply`,
    };
  }
  if (doc.outcome !== 'APPROVED') {
    return {
      applied: false,
      reason: `decision outcome is ${doc.outcome ?? 'unknown'} — nothing activates`,
    };
  }

  // --- Content binding: the hash voters signed over must match the content ---
  const content = doc.proposal.proposedContent as AllocationPolicyContent | null;
  if (
    !content ||
    typeof content.max_cat_daily_spend_btc !== 'number' ||
    content.max_cat_daily_spend_btc <= 0 ||
    typeof content.max_cat_btc_per_action !== 'number' ||
    content.max_cat_btc_per_action <= 0
  ) {
    return { applied: false, reason: 'proposed content is not a valid allocation policy' };
  }
  const localHash = contentHashOf(content);
  if (localHash !== doc.proposal.contentHash) {
    return {
      applied: false,
      reason: `content hash mismatch: recomputed ${localHash}, document claims ${doc.proposal.contentHash}`,
    };
  }

  // --- Votes: pinned keys only, signatures re-verified, messages re-derived ---
  const { data: pinnedRows, error: pinError } = await supabase
    .from(DATABASE_TABLES.SOLON_TRUSTED_KEYS)
    .select('bitcoin_address, voting_weight')
    .is('revoked_at', null);
  if (pinError) {
    return { applied: false, reason: `trusted keys unavailable: ${pinError.message}` };
  }
  const pinned = new Map((pinnedRows ?? []).map(r => [r.bitcoin_address, Number(r.voting_weight)]));
  if (pinned.size === 0) {
    return {
      applied: false,
      reason: 'no trusted keys pinned — run scripts/solon/pin-trusted-keys.ts first',
    };
  }

  if (!Array.isArray(doc.votes) || doc.votes.length === 0) {
    return { applied: false, reason: 'decision has no votes' };
  }
  const tally = { yes: 0, no: 0, abstain: 0 };
  const seen = new Set<string>();
  for (const vote of doc.votes) {
    const address = vote.member?.bitcoinAddress;
    if (!address || !pinned.has(address)) {
      return {
        applied: false,
        reason: `vote from unpinned address ${address ?? '(missing)'} — refusing the decision`,
      };
    }
    if (seen.has(address)) {
      return { applied: false, reason: `duplicate vote from ${address}` };
    }
    seen.add(address);

    const choice = vote.choice?.toLowerCase();
    if (choice !== 'yes' && choice !== 'no' && choice !== 'abstain') {
      return { applied: false, reason: `invalid vote choice ${vote.choice}` };
    }
    const expectedMessage = solonVoteMessage({
      sessionId: decisionId,
      choice,
      memberAddress: address,
    });
    if (vote.signedMessage !== expectedMessage) {
      return {
        applied: false,
        reason: `signed message for ${address} does not bind this session/choice/voter`,
      };
    }
    const verification = verifyBitcoinMessage(expectedMessage, address, vote.signature);
    if (!verification.valid) {
      return {
        applied: false,
        reason: `signature from ${address} failed verification: ${verification.reason}`,
      };
    }
    // Weight comes from OUR pinned row — the document's weight is not consulted.
    tally[choice] += pinned.get(address)!;
  }

  // --- Recompute the outcome: quorum against OUR pinned electorate ---
  const eligibleWeight = Array.from(pinned.values()).reduce((s, w) => s + w, 0);
  const cast = tally.yes + tally.no + tally.abstain;
  const quorumPercent = doc.rules?.quorumPercent;
  if (typeof quorumPercent !== 'number' || quorumPercent <= 0 || quorumPercent > 100) {
    return { applied: false, reason: `invalid quorum rule ${quorumPercent}` };
  }
  if (cast < (quorumPercent / 100) * eligibleWeight) {
    return {
      applied: false,
      reason: `verified votes (${cast}) below quorum of the pinned electorate`,
    };
  }
  const decisive = tally.yes + tally.no;
  const passes =
    decisive > 0 &&
    (doc.rules?.threshold === 'SUPERMAJORITY'
      ? tally.yes / decisive >= SUPERMAJORITY_FRACTION
      : tally.yes > tally.no);
  if (!passes) {
    return {
      applied: false,
      reason:
        'recomputed tally does not pass the threshold — refusing the claimed APPROVED outcome',
    };
  }

  // --- Record and activate ---
  const nowIso = new Date().toISOString();
  let rowId: string;
  const { data: draft } = await supabase
    .from(DATABASE_TABLES.ALLOCATION_POLICIES)
    .select('id, version')
    .eq('policy_key', ALLOCATION_POLICY_KEY)
    .eq('content_hash', localHash)
    .eq('status', 'draft')
    .maybeSingle();

  if (draft) {
    // Cat-proposed drafts already exist; attach the decision to them.
    const { error } = await supabase
      .from(DATABASE_TABLES.ALLOCATION_POLICIES)
      .update({
        solon_decision_id: decisionId,
        decision_document: doc as never,
        verified_at: nowIso,
      })
      .eq('id', draft.id);
    if (error) {
      return { applied: false, reason: `failed to attach decision to draft: ${error.message}` };
    }
    rowId = draft.id;
  } else {
    const { data: latest } = await supabase
      .from(DATABASE_TABLES.ALLOCATION_POLICIES)
      .select('version')
      .eq('policy_key', ALLOCATION_POLICY_KEY)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;
    const { data: inserted, error } = await supabase
      .from(DATABASE_TABLES.ALLOCATION_POLICIES)
      .insert({
        policy_key: ALLOCATION_POLICY_KEY,
        version: nextVersion,
        content: content as never,
        content_hash: localHash,
        status: 'draft',
        solon_decision_id: decisionId,
        decision_document: doc as never,
        verified_at: nowIso,
      })
      .select('id')
      .single();
    if (error || !inserted) {
      return { applied: false, reason: `failed to record verified version: ${error?.message}` };
    }
    rowId = inserted.id;
  }

  const activation = await activateVersion(supabase, rowId);
  if (!activation.activated) {
    return { applied: false, reason: activation.reason };
  }
  logger.info(
    'Solon decision verified and applied',
    { decisionId, version: activation.version },
    'Solon'
  );
  return { applied: true, version: activation.version };
}
