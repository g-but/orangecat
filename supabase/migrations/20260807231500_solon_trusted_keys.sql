-- Solon trusted keys — OrangeCat's honest trust anchor for governance (OC2).
--
-- WHY: a Solon decision document is evidence, not authority. Before acting on
-- one, OrangeCat re-verifies every vote signature LOCALLY — and "verifies
-- against what" is this table: the small, operator-pinned set of member public
-- keys/addresses OrangeCat recognizes. Keys pinned here are fetched from
-- Solon's public roster by scripts/solon/pin-trusted-keys.ts (owner-gated) and
-- reviewed at pin time; a vote from an address not pinned here contributes
-- nothing, whatever the document claims. As membership scales, changes to this
-- roster themselves become Solon decisions applied through the same verify
-- path — documented limitation of v1, not an accident.
--
-- Service-role-only: RLS enabled with no anon/authenticated policies.
-- Idempotent: may be pre-applied to the live DB for type generation.

CREATE TABLE IF NOT EXISTS public.solon_trusted_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Solon's member id (uuid there; text here — it is a foreign system's id).
  solon_member_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  member_type text NOT NULL CHECK (member_type IN ('HUMAN', 'AGENT')),
  -- The address votes must recover to; the actual trust anchor.
  bitcoin_address text NOT NULL UNIQUE,
  public_key_hex text,
  voting_weight numeric NOT NULL DEFAULT 1,
  added_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.solon_trusted_keys ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.solon_trusted_keys TO service_role;
