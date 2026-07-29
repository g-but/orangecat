-- Cat Credits — make crediting idempotent on `ref` (money-safety, pre-launch).
--
-- The top-up settle path (checkTopUp) credits a `topup` entry keyed by the
-- invoice's payment_hash and calls this a "credit … idempotent on payment_hash".
-- It never actually was: cat_credit_append did a plain INSERT with NO uniqueness
-- on ref, so the same settled invoice credited more than once whenever the
-- crediting ran twice — concurrent pollers, or a retry after a transient error.
-- With real Bitcoin about to flow, that's a double-credit (money OUT) leak, the
-- mirror of the overdraw leak the previous migration closed.
--
-- Fix: give `ref`-carrying entries true exactly-once semantics.
--   1. A partial unique index makes (user_id, kind, ref) unique for entries that
--      carry a ref (top-ups by payment_hash, refunds, etc.). Usage debits carry
--      no ref and are unaffected — each metered charge is its own row.
--   2. cat_credit_append short-circuits (under the same per-user advisory lock)
--      when the ref already exists: it records nothing and returns the CURRENT
--      balance. So a retried/duplicated settlement is a safe no-op that still
--      reports success — the caller marks the top-up paid and moves on, and the
--      user is credited exactly once.
--
-- Safe to apply while the engine is dormant (PLATFORM_NWC_URI unset, no ref-
-- carrying entries exist yet, so the unique index builds cleanly). Fully
-- backward-compatible: same 6-arg signature, same behaviour for ref = NULL.
--
-- Idempotent migration: CREATE INDEX IF NOT EXISTS + CREATE OR REPLACE FUNCTION,
-- so re-running never collides.

CREATE UNIQUE INDEX IF NOT EXISTS cat_credit_entries_user_kind_ref_uidx
  ON public.cat_credit_entries (user_id, kind, ref)
  WHERE ref IS NOT NULL;

CREATE OR REPLACE FUNCTION public.cat_credit_append(
  p_user_id uuid,
  p_kind text,
  p_amount_btc numeric,
  p_ref text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT NULL::jsonb,
  p_allow_overdraw boolean DEFAULT false
) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_current numeric;
  v_new numeric;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Exactly-once for ref-carrying entries. A Lightning top-up is keyed by its
  -- payment_hash; if this ref is already recorded, credit nothing and return the
  -- balance unchanged, so a retried settlement is a safe no-op, not a double
  -- credit. The advisory lock serializes appends per user, so this check plus
  -- the unique index (as a hard backstop) guarantee the invariant.
  if p_ref is not null and exists (
    select 1 from public.cat_credit_entries
     where user_id = p_user_id and kind = p_kind and ref = p_ref
  ) then
    return public.cat_credit_balance(p_user_id);
  end if;

  v_current := public.cat_credit_balance(p_user_id);
  v_new := v_current + p_amount_btc;

  -- Reject an overdraw ONLY for pre-authorization. A settlement for an
  -- already-served request (p_allow_overdraw = true) must record the charge
  -- regardless — the compute was delivered; not billing it is lost revenue.
  if v_new < 0 and not p_allow_overdraw then
    raise exception 'insufficient_credits' using errcode = 'check_violation';
  end if;

  insert into public.cat_credit_entries (user_id, kind, amount_btc, balance_after_btc, ref, metadata)
  values (p_user_id, p_kind, p_amount_btc, v_new, p_ref, p_metadata);

  return v_new;
end;
$$;

REVOKE ALL ON FUNCTION public.cat_credit_append(uuid, text, numeric, text, jsonb, boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.cat_credit_append(uuid, text, numeric, text, jsonb, boolean) TO service_role;
