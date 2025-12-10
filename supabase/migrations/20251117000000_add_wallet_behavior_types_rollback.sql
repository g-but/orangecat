-- ROLLBACK: 20251117000000_add_wallet_behavior_types
-- Generated: 2025-12-04T12:37:00.473Z
-- Source: 20251117000000_add_wallet_behavior_types.sql

DROP INDEX IF EXISTS idx_wallets_behavior_type;
DROP INDEX IF EXISTS idx_wallets_goal_status;
DROP INDEX IF EXISTS idx_wallets_period;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_budget_periods_wallet;
DROP INDEX IF EXISTS idx_budget_periods_active;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_goal_milestones_wallet;
DROP INDEX IF EXISTS idx_goal_milestones_reached;
DROP TABLE IF EXISTS public CASCADE;
DROP INDEX IF EXISTS idx_wallet_contributions_wallet;
DROP INDEX IF EXISTS idx_wallet_contributions_profile;
DROP FUNCTION IF EXISTS initialize_wallet_period;
-- MANUAL: Review data inserted into budget_periods
DROP TRIGGER IF EXISTS initialize_wallet_period_trigger ON public;
DROP FUNCTION IF EXISTS check_goal_milestones;
-- MANUAL: Review data inserted into goal_milestones
DROP TRIGGER IF EXISTS check_goal_milestones_trigger ON public;
DROP FUNCTION IF EXISTS reset_expired_budget_periods;
-- MANUAL: Review data inserted into budget_periods
DROP VIEW IF EXISTS wallets_with_totals;

-- Rollback completed: 20251117000000_add_wallet_behavior_types