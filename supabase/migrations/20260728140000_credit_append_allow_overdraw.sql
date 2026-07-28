-- Money-holds fix: close the "served but not billed" free-ride.
--
-- cat_credit_append() rejected any entry that drove the balance below zero
-- (`insufficient_credits`). That's correct for a PRE-serve authorization, but
-- both spend paths (Cat frontier metering + AI-assistant per-message) call it
-- AFTER the response is already served. When the actual charge exceeded the
-- remaining balance the debit was rejected and NOTHING was written — the
-- request was served for free, and it recurred every time the balance sat below
-- one request's cost (unlimited free frontier calls; concurrent assistant
-- messages that all pass the pre-check then serve free).
--
-- Fix: add an `allow_overdraw` mode. The pre-serve gate stays strict
-- (default false); a POST-serve settlement passes true so the charge is ALWAYS
-- recorded — even into a negative balance — and the balance gate then blocks the
-- next request until top-up. Additive + backward-compatible: the extra param
-- defaults to false, so every existing 5-arg caller is unchanged.
--
-- Safe to apply while the credits engine is dormant (PLATFORM_NWC_URI unset,
-- all balances 0) — and it changes no behaviour for callers that don't opt in.
--
-- Idempotent: DROP IF EXISTS clears the old 5-arg signature (no-op if already
-- gone), and CREATE OR REPLACE installs/updates the 6-arg one whether or not it
-- already exists — so re-running (e.g. after a manual apply) never collides.

DROP FUNCTION IF EXISTS public.cat_credit_append(uuid, text, numeric, text, jsonb);

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
