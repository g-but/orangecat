-- Migration: Add support for Recurring Budgets vs One-Time Goals
-- This distinguishes between flow-through wallets (monthly budgets)
-- and accumulation wallets (save for a purchase)
-- Date: 2025-11-17

BEGIN;

-- ============================================================================
-- STEP 1: Add wallet behavior type and related fields
-- ============================================================================

-- Add new columns to wallets table
ALTER TABLE public.wallets
  -- Wallet behavior: what is this wallet for?
  ADD COLUMN behavior_type TEXT NOT NULL DEFAULT 'general'
    CHECK (behavior_type IN ('general', 'recurring_budget', 'one_time_goal')),

  -- For recurring budgets
  ADD COLUMN budget_amount NUMERIC(20,8) CHECK (budget_amount > 0),
  ADD COLUMN budget_currency TEXT DEFAULT 'USD'
    CHECK (budget_currency IN ('USD', 'EUR', 'BTC', 'SATS', 'CHF')),
  ADD COLUMN budget_period TEXT DEFAULT 'monthly'
    CHECK (budget_period IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  ADD COLUMN budget_period_start_day INT CHECK (budget_period_start_day BETWEEN 1 AND 31),
  ADD COLUMN budget_reset_day INT CHECK (budget_reset_day BETWEEN 1 AND 31),
  ADD COLUMN current_period_start TIMESTAMPTZ,
  ADD COLUMN current_period_end TIMESTAMPTZ,
  ADD COLUMN current_period_spent NUMERIC(20,8) DEFAULT 0 CHECK (current_period_spent >= 0),
  ADD COLUMN alert_threshold_percent INT DEFAULT 80 CHECK (alert_threshold_percent BETWEEN 1 AND 100),
  ADD COLUMN alert_sent_at TIMESTAMPTZ,

  -- For one-time goals
  ADD COLUMN goal_status TEXT DEFAULT 'active'
    CHECK (goal_status IN ('active', 'paused', 'reached', 'purchased', 'cancelled', 'archived')),
  ADD COLUMN goal_reached_at TIMESTAMPTZ,
  ADD COLUMN goal_purchased_at TIMESTAMPTZ,
  ADD COLUMN purchase_notes TEXT,
  ADD COLUMN milestone_25_reached_at TIMESTAMPTZ,
  ADD COLUMN milestone_50_reached_at TIMESTAMPTZ,
  ADD COLUMN milestone_75_reached_at TIMESTAMPTZ,
  ADD COLUMN milestone_100_reached_at TIMESTAMPTZ,

  -- Social features for goals
  ADD COLUMN is_public_goal BOOLEAN DEFAULT false,
  ADD COLUMN allow_contributions BOOLEAN DEFAULT false,
  ADD COLUMN contribution_count INT DEFAULT 0 CHECK (contribution_count >= 0),

  -- Analytics
  ADD COLUMN last_transaction_at TIMESTAMPTZ,
  ADD COLUMN transaction_count INT DEFAULT 0 CHECK (transaction_count >= 0),
  ADD COLUMN total_received NUMERIC(20,8) DEFAULT 0 CHECK (total_received >= 0),
  ADD COLUMN total_spent NUMERIC(20,8) DEFAULT 0 CHECK (total_spent >= 0);

-- Comments
COMMENT ON COLUMN public.wallets.behavior_type IS
  'general = no special behavior, recurring_budget = monthly/weekly spending limit, one_time_goal = save toward a purchase';
COMMENT ON COLUMN public.wallets.budget_amount IS
  'Maximum amount to spend per budget period (for recurring budgets)';
COMMENT ON COLUMN public.wallets.budget_period IS
  'How often the budget resets (for recurring budgets)';
COMMENT ON COLUMN public.wallets.current_period_spent IS
  'Amount spent in current budget period';
COMMENT ON COLUMN public.wallets.goal_status IS
  'Status of savings goal: active, paused, reached, purchased, cancelled, archived';
COMMENT ON COLUMN public.wallets.goal_reached_at IS
  'When the goal amount was first reached';
COMMENT ON COLUMN public.wallets.goal_purchased_at IS
  'When the user marked the goal as purchased/completed';

-- Indexes for filtering and performance
CREATE INDEX idx_wallets_behavior_type ON public.wallets(behavior_type, is_active);
CREATE INDEX idx_wallets_goal_status ON public.wallets(goal_status)
  WHERE behavior_type = 'one_time_goal';
CREATE INDEX idx_wallets_period ON public.wallets(current_period_start, current_period_end)
  WHERE behavior_type = 'recurring_budget';

-- ============================================================================
-- STEP 2: Create budget_periods table for historical tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,

  -- Period info
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),

  -- Budget tracking
  budget_amount NUMERIC(20,8) NOT NULL CHECK (budget_amount > 0),
  budget_currency TEXT NOT NULL,
  amount_spent NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (amount_spent >= 0),

  -- Stats
  transaction_count INT DEFAULT 0 CHECK (transaction_count >= 0),
  average_transaction NUMERIC(20,8),
  largest_transaction NUMERIC(20,8),

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'rolled_over', 'cancelled')),
  completion_rate NUMERIC(5,2) CHECK (completion_rate BETWEEN 0 AND 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT unique_wallet_period UNIQUE(wallet_id, period_start)
);

COMMENT ON TABLE public.budget_periods IS
  'Historical tracking of budget periods for recurring budget wallets';

CREATE INDEX idx_budget_periods_wallet ON public.budget_periods(wallet_id, period_start DESC);
CREATE INDEX idx_budget_periods_active ON public.budget_periods(wallet_id)
  WHERE status = 'active';

-- ============================================================================
-- STEP 3: Create goal_milestones table for celebration tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,

  -- Milestone info
  milestone_percent INT NOT NULL CHECK (milestone_percent > 0 AND milestone_percent <= 100),
  milestone_amount NUMERIC(20,8) NOT NULL CHECK (milestone_amount > 0),

  -- Achievement
  reached_at TIMESTAMPTZ,
  was_celebrated BOOLEAN DEFAULT false,
  shared_publicly BOOLEAN DEFAULT false,

  -- Context
  transaction_id UUID,  -- The transaction that triggered the milestone
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_wallet_milestone UNIQUE(wallet_id, milestone_percent)
);

COMMENT ON TABLE public.goal_milestones IS
  'Track milestone achievements for one-time savings goals (25%, 50%, 75%, 100%)';

CREATE INDEX idx_goal_milestones_wallet ON public.goal_milestones(wallet_id);
CREATE INDEX idx_goal_milestones_reached ON public.goal_milestones(reached_at)
  WHERE reached_at IS NOT NULL;

-- ============================================================================
-- STEP 4: Create wallet_contributions table for social funding
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallet_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,

  -- Contributor info
  contributor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contributor_name TEXT,  -- For anonymous contributions
  is_anonymous BOOLEAN DEFAULT false,

  -- Contribution details
  amount_btc NUMERIC(20,8) NOT NULL CHECK (amount_btc > 0),
  amount_usd NUMERIC(20,2),  -- Snapshot at contribution time
  message TEXT CHECK (char_length(message) <= 500),

  -- Transaction tracking
  transaction_hash TEXT,
  confirmed_at TIMESTAMPTZ,

  -- Social
  thanked BOOLEAN DEFAULT false,
  public_visibility BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.wallet_contributions IS
  'Track contributions from others toward public savings goals';

CREATE INDEX idx_wallet_contributions_wallet ON public.wallet_contributions(wallet_id, created_at DESC);
CREATE INDEX idx_wallet_contributions_profile ON public.wallet_contributions(contributor_profile_id);

-- ============================================================================
-- STEP 5: Function to initialize budget period when wallet is created
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_wallet_period()
RETURNS TRIGGER AS $$
DECLARE
  period_end_date TIMESTAMPTZ;
BEGIN
  -- Only for recurring budgets
  IF NEW.behavior_type = 'recurring_budget' AND NEW.budget_period IS NOT NULL THEN

    -- Set period start to now if not set
    IF NEW.current_period_start IS NULL THEN
      NEW.current_period_start := now();
    END IF;

    -- Calculate period end based on period type
    IF NEW.budget_period = 'daily' THEN
      period_end_date := NEW.current_period_start + INTERVAL '1 day';
    ELSIF NEW.budget_period = 'weekly' THEN
      period_end_date := NEW.current_period_start + INTERVAL '1 week';
    ELSIF NEW.budget_period = 'biweekly' THEN
      period_end_date := NEW.current_period_start + INTERVAL '2 weeks';
    ELSIF NEW.budget_period = 'monthly' THEN
      period_end_date := NEW.current_period_start + INTERVAL '1 month';
    ELSIF NEW.budget_period = 'quarterly' THEN
      period_end_date := NEW.current_period_start + INTERVAL '3 months';
    ELSIF NEW.budget_period = 'yearly' THEN
      period_end_date := NEW.current_period_start + INTERVAL '1 year';
    ELSE
      period_end_date := NEW.current_period_start + INTERVAL '1 month';  -- default
    END IF;

    NEW.current_period_end := period_end_date;

    -- Create initial budget period record
    INSERT INTO budget_periods (
      wallet_id, period_start, period_end, period_type,
      budget_amount, budget_currency, status
    ) VALUES (
      NEW.id, NEW.current_period_start, period_end_date, NEW.budget_period,
      NEW.budget_amount, NEW.budget_currency, 'active'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER initialize_wallet_period_trigger
  AFTER INSERT ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION initialize_wallet_period();

-- ============================================================================
-- STEP 6: Function to track goal milestones
-- ============================================================================

CREATE OR REPLACE FUNCTION check_goal_milestones()
RETURNS TRIGGER AS $$
DECLARE
  goal_amount NUMERIC(20,8);
  current_balance NUMERIC(20,8);
  progress_percent NUMERIC(5,2);
  milestone_pct INT;
BEGIN
  -- Only for one-time goals with a goal amount
  IF NEW.behavior_type = 'one_time_goal' AND NEW.goal_amount IS NOT NULL AND NEW.goal_amount > 0 THEN

    goal_amount := NEW.goal_amount;
    current_balance := NEW.balance_btc;
    progress_percent := (current_balance / goal_amount) * 100;

    -- Check and create milestone records
    FOR milestone_pct IN SELECT unnest(ARRAY[25, 50, 75, 100]) LOOP
      IF progress_percent >= milestone_pct THEN
        -- Insert or update milestone
        INSERT INTO goal_milestones (wallet_id, milestone_percent, milestone_amount, reached_at)
        VALUES (NEW.id, milestone_pct, goal_amount * (milestone_pct / 100.0), now())
        ON CONFLICT (wallet_id, milestone_percent)
        DO UPDATE SET reached_at = COALESCE(goal_milestones.reached_at, now());
      END IF;
    END LOOP;

    -- Update wallet milestone fields for quick access
    IF progress_percent >= 25 AND NEW.milestone_25_reached_at IS NULL THEN
      NEW.milestone_25_reached_at := now();
    END IF;
    IF progress_percent >= 50 AND NEW.milestone_50_reached_at IS NULL THEN
      NEW.milestone_50_reached_at := now();
    END IF;
    IF progress_percent >= 75 AND NEW.milestone_75_reached_at IS NULL THEN
      NEW.milestone_75_reached_at := now();
    END IF;
    IF progress_percent >= 100 AND NEW.milestone_100_reached_at IS NULL THEN
      NEW.milestone_100_reached_at := now();
      NEW.goal_reached_at := now();
      NEW.goal_status := 'reached';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_goal_milestones_trigger
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  WHEN (OLD.balance_btc IS DISTINCT FROM NEW.balance_btc)
  EXECUTE FUNCTION check_goal_milestones();

-- ============================================================================
-- STEP 7: Function to reset budget periods automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_expired_budget_periods()
RETURNS void AS $$
DECLARE
  wallet_record RECORD;
  new_period_end TIMESTAMPTZ;
BEGIN
  -- Find all recurring budget wallets with expired periods
  FOR wallet_record IN
    SELECT * FROM wallets
    WHERE behavior_type = 'recurring_budget'
      AND is_active = true
      AND current_period_end <= now()
  LOOP
    -- Mark current period as completed
    UPDATE budget_periods
    SET
      status = 'completed',
      completed_at = now(),
      completion_rate = CASE
        WHEN wallet_record.budget_amount > 0
        THEN (wallet_record.current_period_spent / wallet_record.budget_amount) * 100
        ELSE 0
      END
    WHERE wallet_id = wallet_record.id
      AND status = 'active';

    -- Calculate new period end
    IF wallet_record.budget_period = 'daily' THEN
      new_period_end := wallet_record.current_period_end + INTERVAL '1 day';
    ELSIF wallet_record.budget_period = 'weekly' THEN
      new_period_end := wallet_record.current_period_end + INTERVAL '1 week';
    ELSIF wallet_record.budget_period = 'biweekly' THEN
      new_period_end := wallet_record.current_period_end + INTERVAL '2 weeks';
    ELSIF wallet_record.budget_period = 'monthly' THEN
      new_period_end := wallet_record.current_period_end + INTERVAL '1 month';
    ELSIF wallet_record.budget_period = 'quarterly' THEN
      new_period_end := wallet_record.current_period_end + INTERVAL '3 months';
    ELSIF wallet_record.budget_period = 'yearly' THEN
      new_period_end := wallet_record.current_period_end + INTERVAL '1 year';
    ELSE
      new_period_end := wallet_record.current_period_end + INTERVAL '1 month';
    END IF;

    -- Update wallet with new period
    UPDATE wallets
    SET
      current_period_start = wallet_record.current_period_end,
      current_period_end = new_period_end,
      current_period_spent = 0,
      alert_sent_at = NULL
    WHERE id = wallet_record.id;

    -- Create new budget period record
    INSERT INTO budget_periods (
      wallet_id, period_start, period_end, period_type,
      budget_amount, budget_currency, status
    ) VALUES (
      wallet_record.id, wallet_record.current_period_end, new_period_end,
      wallet_record.budget_period, wallet_record.budget_amount,
      wallet_record.budget_currency, 'active'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_expired_budget_periods() IS
  'Call this function via cron to automatically reset budget periods (run daily)';

-- ============================================================================
-- STEP 8: Enhanced view with behavior-specific data
-- ============================================================================

DROP VIEW IF EXISTS wallets_with_totals;

CREATE OR REPLACE VIEW wallets_with_totals AS
SELECT
  w.*,

  -- Balance calculations
  COALESCE(
    CASE
      WHEN w.wallet_type = 'address' THEN w.balance_btc
      WHEN w.wallet_type = 'xpub' THEN (
        SELECT COALESCE(SUM(balance_btc), 0)
        FROM wallet_addresses
        WHERE wallet_id = w.id
      )
      ELSE 0
    END,
    0
  ) as total_balance_btc,

  -- Goal progress (for one-time goals)
  CASE
    WHEN w.behavior_type = 'one_time_goal'
      AND w.goal_amount IS NOT NULL
      AND w.goal_amount > 0
    THEN (w.balance_btc / w.goal_amount * 100)
    ELSE NULL
  END as goal_progress_percent,

  -- Budget usage (for recurring budgets)
  CASE
    WHEN w.behavior_type = 'recurring_budget'
      AND w.budget_amount IS NOT NULL
      AND w.budget_amount > 0
    THEN (w.current_period_spent / w.budget_amount * 100)
    ELSE NULL
  END as budget_usage_percent,

  -- Budget remaining
  CASE
    WHEN w.behavior_type = 'recurring_budget'
      AND w.budget_amount IS NOT NULL
    THEN w.budget_amount - w.current_period_spent
    ELSE NULL
  END as budget_remaining,

  -- Days left in budget period
  CASE
    WHEN w.behavior_type = 'recurring_budget'
      AND w.current_period_end IS NOT NULL
    THEN EXTRACT(DAY FROM (w.current_period_end - now()))
    ELSE NULL
  END as budget_days_remaining,

  -- Days until goal deadline
  CASE
    WHEN w.behavior_type = 'one_time_goal'
      AND w.goal_deadline IS NOT NULL
    THEN EXTRACT(DAY FROM (w.goal_deadline - now()))
    ELSE NULL
  END as goal_days_remaining,

  -- Amount needed per day to reach goal
  CASE
    WHEN w.behavior_type = 'one_time_goal'
      AND w.goal_amount IS NOT NULL
      AND w.goal_deadline IS NOT NULL
      AND w.goal_deadline > now()
    THEN (w.goal_amount - w.balance_btc) / GREATEST(EXTRACT(DAY FROM (w.goal_deadline - now())), 1)
    ELSE NULL
  END as daily_savings_needed

FROM wallets w;

COMMENT ON VIEW wallets_with_totals IS
  'Wallets with computed balances, progress, budget usage, and time calculations';

-- ============================================================================
-- STEP 9: RLS policies for new tables
-- ============================================================================

ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_contributions ENABLE ROW LEVEL SECURITY;

-- Budget periods: visible to wallet owners
CREATE POLICY "budget_periods_select"
  ON public.budget_periods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = budget_periods.wallet_id
      AND w.user_id = auth.uid()
    )
  );

-- Goal milestones: visible to wallet owners and public if goal is public
CREATE POLICY "goal_milestones_select"
  ON public.goal_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = goal_milestones.wallet_id
      AND (w.user_id = auth.uid() OR w.is_public_goal = true)
    )
  );

-- Contributions: visible if goal is public or user is owner
CREATE POLICY "wallet_contributions_select"
  ON public.wallet_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = wallet_contributions.wallet_id
      AND (w.user_id = auth.uid() OR (w.is_public_goal = true AND public_visibility = true))
    )
  );

-- Contributions: anyone can insert to public goals
CREATE POLICY "wallet_contributions_insert"
  ON public.wallet_contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = wallet_contributions.wallet_id
      AND w.is_public_goal = true
      AND w.allow_contributions = true
    )
  );

COMMIT;
