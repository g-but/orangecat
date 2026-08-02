-- Wallets read lockdown — two independent tightenings:
--
-- 1. ROWS: wallet rows are readable only by their owner. The old public arm
--    ("any active wallet of an existing profile/active project") existed so
--    browser code could answer "can this seller be paid?" by inspecting rows.
--    That question is now answered server-side by the same wallet resolution
--    the payment flow runs (GET /api/payments/can-receive), so no client ever
--    needs to read another user's wallet rows — which also stops address_or_xpub
--    (an xpub reveals the owner's ENTIRE address history) from being publicly
--    selectable.
--
-- 2. COLUMNS: nwc_connection_uri is a write-only secret for client roles.
--    It was encrypted but still selectable; app code promised "never echoed
--    back" while `select('*')` quietly returned it. Column-level grants make
--    the database enforce the contract: client roles can INSERT/UPDATE it but
--    never SELECT it. Only service_role (payment detection, receive-status
--    probing, Cat's own-wallet payments — all server-side, post-authorization)
--    can read it.
--
-- Postgres cannot subtract one column from a table-level SELECT grant, so the
-- grant is rebuilt as an explicit column list (every column except the secret).
-- Client code therefore must not `select('*')` on wallets — all call sites use
-- WALLET_CLIENT_COLUMNS (src/config/database-tables.ts), the code-side mirror
-- of this list.

DROP POLICY IF EXISTS wallets_select ON public.wallets;
DROP POLICY IF EXISTS wallets_select_own ON public.wallets;
-- profile_id IS the auth user id for profile wallets; user_id covers project
-- wallets. Either identifies the owner (user_id is nullable with no default,
-- so don't key on it alone).
CREATE POLICY wallets_select_own ON public.wallets
  FOR SELECT USING ((SELECT auth.uid()) IN (user_id, profile_id));

REVOKE SELECT ON public.wallets FROM anon, authenticated;
GRANT SELECT (
  id, profile_id, project_id, user_id, label, description, address_or_xpub,
  wallet_type, category, category_icon, behavior_type, budget_amount,
  budget_period, goal_amount, goal_currency, goal_deadline, balance_btc,
  balance_updated_at, is_active, display_order, is_primary, created_at,
  updated_at, lightning_address, next_derivation_index
) ON public.wallets TO anon, authenticated;

COMMENT ON COLUMN public.wallets.nwc_connection_uri IS
  'Encrypted NWC connection URI. WRITE-ONLY for client roles (no column SELECT grant) — read exclusively through service_role after authorization.';
