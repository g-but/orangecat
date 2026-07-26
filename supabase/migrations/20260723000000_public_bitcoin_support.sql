-- Account-free, tracked Bitcoin support.
--
-- Public supporters do not have an auth.users row, so buyer/contributor identity
-- is nullable. Access to status is instead granted by a high-entropy token whose
-- SHA-256 hash is stored on the payment intent. intent_kind keeps a voluntary
-- contribution to a product/service separate from purchasing that offering.

ALTER TABLE payment_intents
  ALTER COLUMN buyer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS intent_kind text NOT NULL DEFAULT 'purchase',
  ADD COLUMN IF NOT EXISTS public_status_token_hash text,
  ADD COLUMN IF NOT EXISTS receiving_wallet_id uuid;

ALTER TABLE payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_intent_kind_check;

ALTER TABLE payment_intents
  ADD CONSTRAINT payment_intents_intent_kind_check
  CHECK (intent_kind IN ('purchase', 'support'));

ALTER TABLE contributions
  ALTER COLUMN contributor_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intents_public_status_token_hash
  ON payment_intents (public_status_token_hash)
  WHERE public_status_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_intents_public_expiry
  ON payment_intents (expires_at)
  WHERE buyer_id IS NULL AND status NOT IN ('paid', 'expired', 'failed');

COMMENT ON COLUMN payment_intents.public_status_token_hash IS
  'SHA-256 hash of the opaque bearer token used to poll an account-free payment.';
COMMENT ON COLUMN payment_intents.intent_kind IS
  'purchase creates/settles an order; support creates a voluntary contribution.';
COMMENT ON COLUMN payment_intents.receiving_wallet_id IS
  'Wallet selected when the request was created; intentionally has no FK because user and group wallets live in separate tables.';

-- Public totals count only payment intents that have actually settled. Older
-- code inserted contribution rows before payment, so joining the payment state
-- is the reliable ledger boundary.
CREATE OR REPLACE FUNCTION get_entity_funding_stats(
  p_entity_type text,
  p_entity_id uuid
)
RETURNS TABLE (
  total_btc numeric,
  contributor_count bigint,
  named_supporter_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visibility text;
BEGIN
  SELECT ew.visibility INTO v_visibility
  FROM entity_wallets ew
  WHERE ew.entity_type = p_entity_type
    AND ew.entity_id = p_entity_id
    AND ew.is_primary = true
  ORDER BY ew.created_at
  LIMIT 1;

  IF v_visibility IS NULL OR v_visibility = 'private' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(c.amount_btc), 0)::numeric,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE c.is_anonymous = false)::bigint
  FROM contributions c
  JOIN payment_intents pi ON pi.id = c.payment_intent_id
  WHERE c.entity_type = p_entity_type
    AND c.entity_id = p_entity_id
    AND pi.status = 'paid';
END;
$$;

GRANT EXECUTE ON FUNCTION get_entity_funding_stats(text, uuid) TO anon, authenticated;
