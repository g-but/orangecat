-- Migration: Add function for internal wallet transfers
-- Date: 2025-11-17

BEGIN;

-- ============================================================================
-- Function to transfer balance between wallets atomically
-- ============================================================================

CREATE OR REPLACE FUNCTION transfer_between_wallets(
  p_from_wallet_id UUID,
  p_to_wallet_id UUID,
  p_amount_btc NUMERIC(20,8),
  p_transaction_id UUID
)
RETURNS void AS $$
DECLARE
  v_from_balance NUMERIC(20,8);
BEGIN
  -- Lock both wallets in consistent order to prevent deadlock
  IF p_from_wallet_id < p_to_wallet_id THEN
    PERFORM id FROM wallets WHERE id = p_from_wallet_id FOR UPDATE;
    PERFORM id FROM wallets WHERE id = p_to_wallet_id FOR UPDATE;
  ELSE
    PERFORM id FROM wallets WHERE id = p_to_wallet_id FOR UPDATE;
    PERFORM id FROM wallets WHERE id = p_from_wallet_id FOR UPDATE;
  END IF;

  -- Get current balance of source wallet
  SELECT balance_btc INTO v_from_balance
  FROM wallets
  WHERE id = p_from_wallet_id;

  -- Verify sufficient balance
  IF v_from_balance < p_amount_btc THEN
    RAISE EXCEPTION 'Insufficient balance in source wallet';
  END IF;

  -- Deduct from source wallet
  UPDATE wallets
  SET
    balance_btc = balance_btc - p_amount_btc,
    updated_at = now()
  WHERE id = p_from_wallet_id;

  -- Add to destination wallet
  UPDATE wallets
  SET
    balance_btc = balance_btc + p_amount_btc,
    updated_at = now()
  WHERE id = p_to_wallet_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transfer_between_wallets IS
  'Atomically transfer BTC balance between two wallets owned by the same user';

COMMIT;
