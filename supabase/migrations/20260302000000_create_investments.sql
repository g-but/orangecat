-- Create investments table for structured investment deals
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  investment_type TEXT NOT NULL DEFAULT 'revenue_share',
  target_amount NUMERIC(18,8) NOT NULL,
  minimum_investment NUMERIC(18,8) NOT NULL DEFAULT 0.0001,
  maximum_investment NUMERIC(18,8),
  total_raised NUMERIC(18,8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BTC',
  expected_return_rate NUMERIC(6,2),
  return_frequency TEXT,
  term_months INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  risk_level TEXT,
  terms TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  investor_count INTEGER NOT NULL DEFAULT 0,
  bitcoin_address TEXT,
  lightning_address TEXT,
  wallet_id UUID REFERENCES wallets(id),
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_investments_actor_id ON investments(actor_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_investment_type ON investments(investment_type);
CREATE INDEX idx_investments_created_at ON investments(created_at DESC);

-- RLS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public investments"
  ON investments FOR SELECT
  USING (is_public = true AND status IN ('open', 'funded', 'active'));

CREATE POLICY "Owner can view own investments"
  ON investments FOR SELECT
  USING (actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()));

CREATE POLICY "Owner can create investments"
  ON investments FOR INSERT
  WITH CHECK (actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()));

CREATE POLICY "Owner can update own investments"
  ON investments FOR UPDATE
  USING (actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()));

CREATE POLICY "Owner can delete draft investments"
  ON investments FOR DELETE
  USING (actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid()) AND status = 'draft');

-- Updated_at trigger
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
