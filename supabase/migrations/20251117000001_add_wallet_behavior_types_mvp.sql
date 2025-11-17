-- Migration: Multi-Wallet MVP - Behavior Types & Simple Goals
-- Simplified version focused on core functionality
-- Date: 2025-11-17

BEGIN;

-- ============================================================================
-- STEP 1: Add behavior type and basic goal/budget tracking
-- ============================================================================

-- Add new columns to wallets table (MVP version - no complex automation)
ALTER TABLE public.wallets
  -- Wallet behavior: determines display and usage pattern
  ADD COLUMN IF NOT EXISTS behavior_type TEXT NOT NULL DEFAULT 'general'
    CHECK (behavior_type IN ('general', 'recurring_budget', 'one_time_goal')),

  -- For recurring budgets (simple tracking, no auto-reset)
  ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(20,8) CHECK (budget_amount > 0),
  ADD COLUMN IF NOT EXISTS budget_period TEXT DEFAULT 'monthly'
    CHECK (budget_period IN ('weekly', 'monthly', 'quarterly', 'yearly'));

-- Note: goal_amount, goal_currency, goal_deadline already exist from previous migration
-- Just update the check constraint to allow NULL

-- Comments
COMMENT ON COLUMN public.wallets.behavior_type IS
  'Determines wallet behavior: general (no limits), recurring_budget (spending limit), one_time_goal (savings target)';
COMMENT ON COLUMN public.wallets.budget_amount IS
  'Optional spending limit per period for recurring budgets';
COMMENT ON COLUMN public.wallets.budget_period IS
  'How often budget conceptually resets (user manually tracks)';

-- Index for filtering by behavior type
CREATE INDEX IF NOT EXISTS idx_wallets_behavior_type
  ON public.wallets(behavior_type, is_active);

-- ============================================================================
-- STEP 2: Update wallets view with behavior-specific calculations
-- ============================================================================

DROP VIEW IF EXISTS wallets_with_totals;

CREATE OR REPLACE VIEW wallets_with_totals AS
SELECT
  w.*,

  -- Total balance calculation (xpub vs single address)
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

  -- Goal progress percentage (for one-time goals)
  CASE
    WHEN w.behavior_type = 'one_time_goal'
      AND w.goal_amount IS NOT NULL
      AND w.goal_amount > 0
    THEN (w.balance_btc / w.goal_amount * 100)
    ELSE NULL
  END as goal_progress_percent,

  -- Days until goal deadline
  CASE
    WHEN w.behavior_type = 'one_time_goal'
      AND w.goal_deadline IS NOT NULL
    THEN EXTRACT(DAY FROM (w.goal_deadline - now()))
    ELSE NULL
  END as goal_days_remaining,

  -- Amount needed per day to reach goal by deadline
  CASE
    WHEN w.behavior_type = 'one_time_goal'
      AND w.goal_amount IS NOT NULL
      AND w.goal_deadline IS NOT NULL
      AND w.goal_deadline > now()
      AND w.goal_amount > w.balance_btc
    THEN (w.goal_amount - w.balance_btc) / GREATEST(EXTRACT(DAY FROM (w.goal_deadline - now())), 1)
    ELSE NULL
  END as daily_savings_needed

FROM wallets w;

COMMENT ON VIEW wallets_with_totals IS
  'Wallets with computed balances and behavior-specific metrics (MVP version)';

COMMIT;
