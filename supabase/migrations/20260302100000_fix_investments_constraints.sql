-- Fix investments table: add missing column, CHECK constraints, amount precision
-- Addresses review findings from investment entity implementation

-- 1. Add missing show_on_profile column (required by profile entities API)
ALTER TABLE investments ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT true;

-- 2. Add CHECK constraints on enum-like columns
ALTER TABLE investments ADD CONSTRAINT check_investment_status
  CHECK (status IN ('draft', 'open', 'funded', 'active', 'closed', 'cancelled'));

ALTER TABLE investments ADD CONSTRAINT check_investment_type
  CHECK (investment_type IN ('equity', 'revenue_share', 'profit_share', 'token', 'other'));

ALTER TABLE investments ADD CONSTRAINT check_return_frequency
  CHECK (return_frequency IS NULL OR return_frequency IN ('monthly', 'quarterly', 'annually', 'at_exit', 'custom'));

ALTER TABLE investments ADD CONSTRAINT check_risk_level
  CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high'));

-- 3. Add positivity/range checks on monetary and count columns
ALTER TABLE investments ADD CONSTRAINT check_target_amount_positive
  CHECK (target_amount > 0);

ALTER TABLE investments ADD CONSTRAINT check_minimum_investment_positive
  CHECK (minimum_investment > 0);

ALTER TABLE investments ADD CONSTRAINT check_maximum_investment_positive
  CHECK (maximum_investment IS NULL OR maximum_investment > 0);

ALTER TABLE investments ADD CONSTRAINT check_total_raised_nonnegative
  CHECK (total_raised >= 0);

ALTER TABLE investments ADD CONSTRAINT check_investor_count_nonnegative
  CHECK (investor_count >= 0);

ALTER TABLE investments ADD CONSTRAINT check_investment_amounts
  CHECK (maximum_investment IS NULL OR minimum_investment <= maximum_investment);

-- 4. Standardize NUMERIC precision to match other entity tables (20,8)
ALTER TABLE investments ALTER COLUMN target_amount TYPE NUMERIC(20,8);
ALTER TABLE investments ALTER COLUMN minimum_investment TYPE NUMERIC(20,8);
ALTER TABLE investments ALTER COLUMN maximum_investment TYPE NUMERIC(20,8);
ALTER TABLE investments ALTER COLUMN total_raised TYPE NUMERIC(20,8);

-- 5. Fix wallet_id foreign key to SET NULL on delete
ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_wallet_id_fkey;
ALTER TABLE investments ADD CONSTRAINT investments_wallet_id_fkey
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL;
