-- Daily BTC spend budget for Cat payment actions.
-- max_btc_per_action existed since baseline but was never enforced; enforcement
-- lands in the same change as this column. Spent-per-day is derived from
-- cat_action_log.amount_btc (no new bookkeeping state).

ALTER TABLE public.cat_permissions
  ADD COLUMN IF NOT EXISTS max_btc_per_day numeric(18, 8)
    CHECK (max_btc_per_day IS NULL OR max_btc_per_day > 0);
