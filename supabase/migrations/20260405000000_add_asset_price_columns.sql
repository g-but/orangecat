-- Migration: Add missing price, rental, sale, and deposit columns to assets table
--
-- The original migration (20260107000004) targeted 'user_assets' but the actual
-- table is 'assets', so the columns were never added. Also, it used _sats columns
-- but the codebase now uses _btc (NUMERIC(18,8)).
--
-- This migration adds ALL columns referenced by:
--   - src/app/api/assets/[id]/rent/route.ts
--   - src/app/api/assets/[id]/availability/route.ts
--   - src/config/entity-configs/asset-config.ts
--   - src/components/create/templates/asset-templates.ts
--   - src/lib/validation/finance.ts (assetSchema)

-- ============================================================================
-- 1. Sale columns
-- ============================================================================
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price_btc NUMERIC(18, 8);

-- ============================================================================
-- 2. Rental columns
-- ============================================================================
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS is_for_rent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rental_price_btc NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS rental_period_type TEXT NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS min_rental_period INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_rental_period INTEGER;

-- Add check constraint for rental_period_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assets_rental_period_type_check'
  ) THEN
    ALTER TABLE assets
      ADD CONSTRAINT assets_rental_period_type_check
      CHECK (rental_period_type IN ('hourly', 'daily', 'weekly', 'monthly'));
  END IF;
END $$;

-- ============================================================================
-- 3. Deposit columns
-- ============================================================================
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount_btc NUMERIC(18, 8);

-- ============================================================================
-- 4. show_on_profile (may already exist from 20260106000000, add IF NOT EXISTS)
-- ============================================================================
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- 5. Update type check constraint to include all types from asset-config.ts
--    Current: real_estate, business, vehicle, equipment, securities, other
--    Missing: luxury, computing, recreational, robot, drone
-- ============================================================================
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_type_check;
ALTER TABLE assets
  ADD CONSTRAINT assets_type_check
  CHECK (type IN (
    'real_estate', 'vehicle', 'luxury', 'equipment', 'computing',
    'recreational', 'robot', 'drone', 'business', 'securities', 'other'
  ));

-- ============================================================================
-- 6. Indexes for filtering
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_assets_is_for_sale ON assets(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_assets_is_for_rent ON assets(is_for_rent) WHERE is_for_rent = true;
CREATE INDEX IF NOT EXISTS idx_assets_type_col ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_show_on_profile ON assets(actor_id, show_on_profile) WHERE show_on_profile = true;

-- ============================================================================
-- 7. Comments
-- ============================================================================
COMMENT ON COLUMN assets.is_for_sale IS 'Whether the asset is listed for sale';
COMMENT ON COLUMN assets.sale_price_btc IS 'Sale price in BTC (NUMERIC(18,8))';
COMMENT ON COLUMN assets.is_for_rent IS 'Whether the asset is available for rent';
COMMENT ON COLUMN assets.rental_price_btc IS 'Rental price in BTC per period';
COMMENT ON COLUMN assets.rental_period_type IS 'Type of rental period: hourly, daily, weekly, monthly';
COMMENT ON COLUMN assets.min_rental_period IS 'Minimum rental periods required';
COMMENT ON COLUMN assets.max_rental_period IS 'Maximum rental periods allowed (null = unlimited)';
COMMENT ON COLUMN assets.requires_deposit IS 'Whether a security deposit is required for rentals';
COMMENT ON COLUMN assets.deposit_amount_btc IS 'Security deposit amount in BTC';
COMMENT ON COLUMN assets.show_on_profile IS 'Whether this asset appears on the user public profile page';
