-- AI Creator Withdrawals System
-- Allows creators to withdraw their earnings from AI assistants

-- Creator withdrawals table
CREATE TABLE IF NOT EXISTS ai_creator_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  -- Lightning payment details
  lightning_address TEXT,
  payment_hash TEXT,
  payment_preimage TEXT,
  -- Metadata
  fee_sats BIGINT DEFAULT 0,
  net_amount_sats BIGINT GENERATED ALWAYS AS (amount_sats - COALESCE(fee_sats, 0)) STORED,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying user withdrawals
CREATE INDEX IF NOT EXISTS idx_ai_creator_withdrawals_user_id ON ai_creator_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_creator_withdrawals_status ON ai_creator_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_ai_creator_withdrawals_created_at ON ai_creator_withdrawals(created_at DESC);

-- Enable RLS
ALTER TABLE ai_creator_withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own withdrawals"
  ON ai_creator_withdrawals
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can request withdrawals"
  ON ai_creator_withdrawals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add withdrawn_sats tracking to ai_assistants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_assistants' AND column_name = 'total_withdrawn_sats') THEN
    ALTER TABLE ai_assistants ADD COLUMN total_withdrawn_sats BIGINT DEFAULT 0;
  END IF;
END $$;

-- Create user-level earnings tracking table
CREATE TABLE IF NOT EXISTS ai_creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earned_sats BIGINT DEFAULT 0,
  total_withdrawn_sats BIGINT DEFAULT 0,
  available_balance_sats BIGINT GENERATED ALWAYS AS (total_earned_sats - total_withdrawn_sats) STORED,
  pending_withdrawal_sats BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ai_creator_earnings_user_id ON ai_creator_earnings(user_id);

-- Enable RLS
ALTER TABLE ai_creator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own earnings"
  ON ai_creator_earnings
  FOR SELECT
  USING (user_id = auth.uid());

-- Function to request withdrawal
CREATE OR REPLACE FUNCTION request_ai_withdrawal(
  p_user_id UUID,
  p_amount_sats BIGINT,
  p_lightning_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_available_balance BIGINT;
  v_pending_sats BIGINT;
  v_withdrawal_id UUID;
BEGIN
  -- Ensure earnings record exists
  INSERT INTO ai_creator_earnings (user_id, total_earned_sats)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get available balance with lock
  SELECT
    available_balance_sats,
    pending_withdrawal_sats
  INTO v_available_balance, v_pending_sats
  FROM ai_creator_earnings
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check sufficient balance (available minus pending)
  IF (v_available_balance - v_pending_sats) < p_amount_sats THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;

  -- Create withdrawal request
  INSERT INTO ai_creator_withdrawals (
    user_id,
    amount_sats,
    lightning_address,
    status
  )
  VALUES (
    p_user_id,
    p_amount_sats,
    p_lightning_address,
    'pending'
  )
  RETURNING id INTO v_withdrawal_id;

  -- Update pending amount
  UPDATE ai_creator_earnings
  SET
    pending_withdrawal_sats = pending_withdrawal_sats + p_amount_sats,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete withdrawal
CREATE OR REPLACE FUNCTION complete_ai_withdrawal(
  p_withdrawal_id UUID,
  p_payment_hash TEXT DEFAULT NULL,
  p_payment_preimage TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount_sats BIGINT;
  v_status TEXT;
BEGIN
  -- Get withdrawal with lock
  SELECT user_id, amount_sats, status
  INTO v_user_id, v_amount_sats, v_status
  FROM ai_creator_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_status != 'pending' AND v_status != 'processing' THEN
    RAISE EXCEPTION 'Withdrawal cannot be completed from status: %', v_status;
  END IF;

  -- Update withdrawal
  UPDATE ai_creator_withdrawals
  SET
    status = 'completed',
    payment_hash = p_payment_hash,
    payment_preimage = p_payment_preimage,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Update earnings
  UPDATE ai_creator_earnings
  SET
    total_withdrawn_sats = total_withdrawn_sats + v_amount_sats,
    pending_withdrawal_sats = pending_withdrawal_sats - v_amount_sats,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fail withdrawal
CREATE OR REPLACE FUNCTION fail_ai_withdrawal(
  p_withdrawal_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount_sats BIGINT;
  v_status TEXT;
BEGIN
  -- Get withdrawal with lock
  SELECT user_id, amount_sats, status
  INTO v_user_id, v_amount_sats, v_status
  FROM ai_creator_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_status != 'pending' AND v_status != 'processing' THEN
    RAISE EXCEPTION 'Withdrawal cannot be failed from status: %', v_status;
  END IF;

  -- Update withdrawal
  UPDATE ai_creator_withdrawals
  SET
    status = 'failed',
    failure_reason = p_reason,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Release pending amount
  UPDATE ai_creator_earnings
  SET
    pending_withdrawal_sats = pending_withdrawal_sats - v_amount_sats,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel withdrawal (user action)
CREATE OR REPLACE FUNCTION cancel_ai_withdrawal(
  p_withdrawal_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_amount_sats BIGINT;
  v_status TEXT;
  v_owner_id UUID;
BEGIN
  -- Get withdrawal with lock
  SELECT user_id, amount_sats, status
  INTO v_owner_id, v_amount_sats, v_status
  FROM ai_creator_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  -- Verify ownership
  IF v_owner_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Only pending withdrawals can be cancelled';
  END IF;

  -- Update withdrawal
  UPDATE ai_creator_withdrawals
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Release pending amount
  UPDATE ai_creator_earnings
  SET
    pending_withdrawal_sats = pending_withdrawal_sats - v_amount_sats,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment_ai_revenue to also track creator earnings
CREATE OR REPLACE FUNCTION increment_ai_revenue(
  p_assistant_id UUID,
  p_amount_sats BIGINT
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get assistant owner
  SELECT user_id INTO v_user_id
  FROM ai_assistants
  WHERE id = p_assistant_id;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Update assistant revenue
  UPDATE ai_assistants
  SET
    total_revenue_sats = COALESCE(total_revenue_sats, 0) + p_amount_sats,
    updated_at = NOW()
  WHERE id = p_assistant_id;

  -- Ensure creator earnings record exists
  INSERT INTO ai_creator_earnings (user_id, total_earned_sats)
  VALUES (v_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update creator earnings
  UPDATE ai_creator_earnings
  SET
    total_earned_sats = total_earned_sats + p_amount_sats,
    updated_at = NOW()
  WHERE user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
