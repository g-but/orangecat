-- Add rental and sale columns to user_assets table
-- This migration adds support for renting and selling assets

-- Add sale columns
ALTER TABLE user_assets
  ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price_sats BIGINT;

-- Add rental columns
ALTER TABLE user_assets
  ADD COLUMN IF NOT EXISTS is_for_rent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rental_price_sats BIGINT,
  ADD COLUMN IF NOT EXISTS rental_period_type TEXT DEFAULT 'daily' CHECK (rental_period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS min_rental_period INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_rental_period INTEGER;

-- Add deposit columns
ALTER TABLE user_assets
  ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount_sats BIGINT;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_user_assets_is_for_sale ON user_assets(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_user_assets_is_for_rent ON user_assets(is_for_rent) WHERE is_for_rent = true;
CREATE INDEX IF NOT EXISTS idx_user_assets_type ON user_assets(type);

-- Add comment
COMMENT ON COLUMN user_assets.is_for_sale IS 'Whether the asset is listed for sale';
COMMENT ON COLUMN user_assets.sale_price_sats IS 'Sale price in satoshis';
COMMENT ON COLUMN user_assets.is_for_rent IS 'Whether the asset is available for rent';
COMMENT ON COLUMN user_assets.rental_price_sats IS 'Rental price in satoshis per period';
COMMENT ON COLUMN user_assets.rental_period_type IS 'Type of rental period: hourly, daily, weekly, monthly';
COMMENT ON COLUMN user_assets.min_rental_period IS 'Minimum rental periods required';
COMMENT ON COLUMN user_assets.max_rental_period IS 'Maximum rental periods allowed (null = unlimited)';
COMMENT ON COLUMN user_assets.requires_deposit IS 'Whether a security deposit is required';
COMMENT ON COLUMN user_assets.deposit_amount_sats IS 'Security deposit amount in satoshis';
