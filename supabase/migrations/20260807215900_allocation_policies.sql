-- Platform allocation policies — the artifact Solon governs (OC0 of the Solon v1 plan).
--
-- WHY: platform-wide limits on the Cat's spending (its "leash") previously had no
-- versioned, governed home: per-user caps live on cat_permissions, but nothing
-- bounds the platform as a whole, and nothing records WHO legitimated a limit.
-- This table holds versioned policy content whose activation (v2+) requires a
-- verified Solon decision document: `verified_at` is only set by
-- src/services/solon/decision-verify.ts after re-verifying every Bitcoin vote
-- signature locally, and activateVersion() refuses rows without it.
-- Version 1 is the operator-seeded genesis (solon refs NULL, labeled bootstrap).
--
-- Service-role-only by convention: RLS enabled with no anon/authenticated
-- policies (service_role bypasses RLS). Public reads go through
-- /api/v1/governance, which uses the admin client and exposes only what is
-- public anyway.
--
-- Idempotent on purpose: the table may be created on the live database ahead of
-- the deploy that ships this file (needed to regenerate database.generated.ts),
-- after which apply-migrations.sh replays it as a no-op.

CREATE TABLE IF NOT EXISTS public.allocation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key text NOT NULL,
  version integer NOT NULL,
  content jsonb NOT NULL,
  -- sha256 hex of the canonical JSON of `content` (key-sorted, no whitespace) —
  -- must match the contentHash Solon's voters signed over.
  content_hash text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'superseded', 'rejected')),
  -- NULL on the genesis version only; later versions reference the Solon
  -- proposal/decision that legitimated them.
  solon_proposal_id text,
  solon_decision_id text,
  -- The decision document as fetched from Solon, stored verbatim for audit.
  decision_document jsonb,
  -- Set exclusively by decision-verify after local signature re-verification.
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  UNIQUE (policy_key, version)
);

-- One active version per policy key.
CREATE UNIQUE INDEX IF NOT EXISTS allocation_policies_one_active
  ON public.allocation_policies (policy_key)
  WHERE status = 'active';

ALTER TABLE public.allocation_policies ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.allocation_policies TO service_role;
