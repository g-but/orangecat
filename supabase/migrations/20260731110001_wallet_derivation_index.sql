-- Per-invoice address derivation from extended public keys.
--
-- On-chain settlement detection matches (address, amount, time window), which
-- is only sound when the address is unique to the payment — with a reused
-- static address a stranger's transaction is indistinguishable from ours, and
-- exactly that false-settle happened in production on 2026-07-31. Uniqueness
-- requires deriving a fresh address per invoice, and derivation needs a
-- counter that two concurrent invoices can never read at the same value.
--
-- The counter lives here, not in application code, because the database is the
-- only place the increment can be atomic: UPDATE .. RETURNING under row-level
-- locking hands each caller a distinct index with no extra machinery.

-- migration-safety: expand-only — new column with default + new function.

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS next_derivation_index integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN wallets.next_derivation_index IS
  'Next unused external-chain (0/i) index for address derivation from address_or_xpub when it holds an extended public key. Allocate ONLY via allocate_derivation_index() — reading then writing races.';

-- Atomically claim the next derivation index for a wallet.
-- SECURITY DEFINER: invoice creation runs cross-user (a buyer''s request mints
-- an address on the SELLER''s wallet), which RLS rightly forbids for direct
-- writes. The function is the narrow, audited exception: it can only ever
-- increment a counter, never read or change anything else.
CREATE OR REPLACE FUNCTION allocate_derivation_index(p_wallet_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE wallets
  SET next_derivation_index = next_derivation_index + 1
  WHERE id = p_wallet_id
  RETURNING next_derivation_index - 1;
$$;

-- Callable by the service role only — invoice creation always goes through the
-- admin client. Nothing user-facing should mint indexes (a hostile client
-- looping on this would burn through the wallet's gap limit).
REVOKE ALL ON FUNCTION allocate_derivation_index(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION allocate_derivation_index(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION allocate_derivation_index(uuid) TO service_role;
