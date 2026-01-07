-- AI User Credits System
-- Manages user balances for AI assistant usage

-- User credits table
CREATE TABLE IF NOT EXISTS ai_user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_sats BIGINT DEFAULT 0 CHECK (balance_sats >= 0),
  total_deposited_sats BIGINT DEFAULT 0,
  total_spent_sats BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Credit transactions log
CREATE TABLE IF NOT EXISTS ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES ai_assistants(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'charge', 'refund', 'bonus')),
  amount_sats BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_user_credits_user_id ON ai_user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_user_id ON ai_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_assistant_id ON ai_credit_transactions(assistant_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_created_at ON ai_credit_transactions(created_at);

-- Enable RLS
ALTER TABLE ai_user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_user_credits
CREATE POLICY "Users can view own credits"
  ON ai_user_credits
  FOR SELECT
  USING (user_id = auth.uid());

-- Only system can modify credits (via RPC functions)

-- RLS Policies for ai_credit_transactions
CREATE POLICY "Users can view own transactions"
  ON ai_credit_transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Function to deduct credits atomically
CREATE OR REPLACE FUNCTION deduct_ai_credits(
  p_user_id UUID,
  p_amount_sats BIGINT,
  p_assistant_id UUID DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_message_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance BIGINT;
  v_new_balance BIGINT;
BEGIN
  -- Get current balance with lock
  SELECT balance_sats INTO v_current_balance
  FROM ai_user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no credits record exists, create one with 0 balance
  IF NOT FOUND THEN
    INSERT INTO ai_user_credits (user_id, balance_sats)
    VALUES (p_user_id, 0);
    v_current_balance := 0;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount_sats THEN
    RETURN FALSE;
  END IF;

  v_new_balance := v_current_balance - p_amount_sats;

  -- Update balance
  UPDATE ai_user_credits
  SET
    balance_sats = v_new_balance,
    total_spent_sats = total_spent_sats + p_amount_sats,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO ai_credit_transactions (
    user_id,
    assistant_id,
    conversation_id,
    message_id,
    transaction_type,
    amount_sats,
    balance_before,
    balance_after,
    description
  )
  VALUES (
    p_user_id,
    p_assistant_id,
    p_conversation_id,
    p_message_id,
    'charge',
    p_amount_sats,
    v_current_balance,
    v_new_balance,
    'AI message charge'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for deposits)
CREATE OR REPLACE FUNCTION add_ai_credits(
  p_user_id UUID,
  p_amount_sats BIGINT,
  p_transaction_type TEXT DEFAULT 'deposit',
  p_description TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_current_balance BIGINT;
  v_new_balance BIGINT;
BEGIN
  -- Ensure record exists
  INSERT INTO ai_user_credits (user_id, balance_sats)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current balance with lock
  SELECT balance_sats INTO v_current_balance
  FROM ai_user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + p_amount_sats;

  -- Update balance
  UPDATE ai_user_credits
  SET
    balance_sats = v_new_balance,
    total_deposited_sats = CASE
      WHEN p_transaction_type = 'deposit' THEN total_deposited_sats + p_amount_sats
      ELSE total_deposited_sats
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO ai_credit_transactions (
    user_id,
    transaction_type,
    amount_sats,
    balance_before,
    balance_after,
    description
  )
  VALUES (
    p_user_id,
    p_transaction_type,
    p_amount_sats,
    v_current_balance,
    v_new_balance,
    COALESCE(p_description, 'Credit ' || p_transaction_type)
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment assistant revenue
CREATE OR REPLACE FUNCTION increment_ai_revenue(
  p_assistant_id UUID,
  p_amount_sats BIGINT
)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_assistants
  SET
    total_revenue_sats = COALESCE(total_revenue_sats, 0) + p_amount_sats,
    updated_at = NOW()
  WHERE id = p_assistant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add statistics columns to ai_assistants if not exist
DO $$
BEGIN
  -- Add total_revenue_sats column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_assistants' AND column_name = 'total_revenue_sats') THEN
    ALTER TABLE ai_assistants ADD COLUMN total_revenue_sats BIGINT DEFAULT 0;
  END IF;

  -- Add total_conversations column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_assistants' AND column_name = 'total_conversations') THEN
    ALTER TABLE ai_assistants ADD COLUMN total_conversations INT DEFAULT 0;
  END IF;

  -- Add total_messages column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_assistants' AND column_name = 'total_messages') THEN
    ALTER TABLE ai_assistants ADD COLUMN total_messages INT DEFAULT 0;
  END IF;
END $$;

-- Trigger to update assistant stats when conversation created
CREATE OR REPLACE FUNCTION update_assistant_conversation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_assistants
  SET total_conversations = total_conversations + 1
  WHERE id = NEW.assistant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_assistant_conversation_count ON ai_conversations;
CREATE TRIGGER trigger_update_assistant_conversation_count
  AFTER INSERT ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_conversation_count();

-- Trigger to update assistant message count
CREATE OR REPLACE FUNCTION update_assistant_message_count()
RETURNS TRIGGER AS $$
DECLARE
  v_assistant_id UUID;
BEGIN
  -- Get assistant_id from conversation
  SELECT assistant_id INTO v_assistant_id
  FROM ai_conversations
  WHERE id = NEW.conversation_id;

  IF v_assistant_id IS NOT NULL AND NEW.role = 'user' THEN
    UPDATE ai_assistants
    SET total_messages = total_messages + 1
    WHERE id = v_assistant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_assistant_message_count ON ai_messages;
CREATE TRIGGER trigger_update_assistant_message_count
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_message_count();
