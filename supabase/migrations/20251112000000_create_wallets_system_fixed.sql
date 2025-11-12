-- Migration: Multi-Wallet System (FIXED VERSION)
-- Allows profiles and projects to have multiple categorized wallets
-- Date: 2025-11-12
-- Status: Production-ready with all security and validation fixes

BEGIN;

-- ============================================================================
-- STEP 1: Create wallets table with proper constraints
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (either profile OR project, never both)
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Denormalized user_id for efficient RLS (set by trigger)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Wallet info
  label TEXT NOT NULL CHECK (char_length(label) <= 100),
  description TEXT CHECK (char_length(description) <= 500),

  -- Bitcoin address/xpub
  address_or_xpub TEXT NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'address' CHECK (wallet_type IN ('address', 'xpub')),

  -- Category
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'rent', 'food', 'medical', 'education', 'emergency', 'transportation', 'utilities', 'custom')),
  category_icon TEXT NOT NULL DEFAULT '💰'
    CHECK (category_icon IN ('💰', '🏠', '🍔', '💊', '🎓', '🚨', '🚗', '💡', '📦')),

  -- Optional goal
  goal_amount NUMERIC(20,8) CHECK (goal_amount > 0),
  goal_currency TEXT DEFAULT 'USD' CHECK (goal_currency IN ('USD', 'EUR', 'BTC', 'SATS', 'CHF')),
  goal_deadline TIMESTAMPTZ,

  -- Balance tracking
  balance_btc NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (balance_btc >= 0),
  balance_updated_at TIMESTAMPTZ,

  -- Display settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT check_has_owner CHECK (
    (profile_id IS NOT NULL AND project_id IS NULL) OR
    (profile_id IS NULL AND project_id IS NOT NULL)
  ),
  CONSTRAINT unique_address_per_entity UNIQUE(profile_id, project_id, address_or_xpub)
);

COMMENT ON TABLE public.wallets IS 'Multi-purpose Bitcoin wallets for profiles and projects';
COMMENT ON COLUMN public.wallets.address_or_xpub IS 'Bitcoin address (bc1q...) or extended public key (zpub...)';
COMMENT ON COLUMN public.wallets.wallet_type IS 'address = single address, xpub = extended public key';
COMMENT ON COLUMN public.wallets.user_id IS 'Denormalized for efficient RLS queries';

-- Indexes for performance
CREATE INDEX idx_wallets_profile ON public.wallets(profile_id, is_active) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_wallets_project ON public.wallets(project_id, is_active) WHERE project_id IS NOT NULL;
CREATE INDEX idx_wallets_user ON public.wallets(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_wallets_balance ON public.wallets(balance_btc) WHERE balance_btc > 0 AND is_active = true;

-- ============================================================================
-- STEP 2: Trigger to set user_id from owner (profiles/projects)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_wallet_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id FROM profiles WHERE id = NEW.profile_id;
  ELSIF NEW.project_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id FROM projects WHERE id = NEW.project_id;
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine user_id for wallet';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_wallet_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION set_wallet_user_id();

-- ============================================================================
-- STEP 3: Trigger to enforce max 10 wallets per entity
-- ============================================================================

CREATE OR REPLACE FUNCTION check_wallet_limit()
RETURNS TRIGGER AS $$
DECLARE
  wallet_count INT;
BEGIN
  -- Only check on insert or when activating
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
    IF NEW.is_active = true THEN
      IF NEW.profile_id IS NOT NULL THEN
        SELECT COUNT(*) INTO wallet_count
        FROM wallets
        WHERE profile_id = NEW.profile_id
          AND is_active = true
          AND (TG_OP = 'INSERT' OR id != NEW.id); -- Exclude self on update

        IF wallet_count >= 10 THEN
          RAISE EXCEPTION 'Maximum 10 active wallets allowed per profile';
        END IF;
      END IF;

      IF NEW.project_id IS NOT NULL THEN
        SELECT COUNT(*) INTO wallet_count
        FROM wallets
        WHERE project_id = NEW.project_id
          AND is_active = true
          AND (TG_OP = 'INSERT' OR id != NEW.id); -- Exclude self on update

        IF wallet_count >= 10 THEN
          RAISE EXCEPTION 'Maximum 10 active wallets allowed per project';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_wallet_limit
  BEFORE INSERT OR UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION check_wallet_limit();

-- ============================================================================
-- STEP 4: Trigger to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_timestamp_trigger
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

-- ============================================================================
-- STEP 5: Create wallet_addresses table (for xpub address derivation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,

  address TEXT NOT NULL,
  derivation_index INT NOT NULL CHECK (derivation_index >= 0),

  balance_btc NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (balance_btc >= 0),
  tx_count INT NOT NULL DEFAULT 0 CHECK (tx_count >= 0),
  last_tx_at TIMESTAMPTZ,

  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_wallet_address UNIQUE(wallet_id, address),
  CONSTRAINT unique_derivation_index UNIQUE(wallet_id, derivation_index)
);

COMMENT ON TABLE public.wallet_addresses IS 'Derived addresses from xpub wallets';

CREATE INDEX idx_wallet_addresses_wallet ON public.wallet_addresses(wallet_id);
CREATE INDEX idx_wallet_addresses_balance ON public.wallet_addresses(wallet_id, balance_btc)
  WHERE balance_btc > 0;

-- ============================================================================
-- STEP 6: Enable RLS with efficient policies
-- ============================================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "wallets_select_public" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_delete_own" ON public.wallets;

-- Public can view active wallets for active projects and public profiles
CREATE POLICY "wallets_select_public"
  ON public.wallets FOR SELECT
  USING (
    is_active = true AND (
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM projects WHERE id = wallets.project_id AND status = 'active'
      ))
      OR (profile_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles WHERE id = wallets.profile_id
      ))
    )
  );

-- Users can view their own wallets (using denormalized user_id)
CREATE POLICY "wallets_select_own"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert wallets for their own profiles/projects
CREATE POLICY "wallets_insert_own"
  ON public.wallets FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    OR auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );

-- Users can update their own wallets
CREATE POLICY "wallets_update_own"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wallets
CREATE POLICY "wallets_delete_own"
  ON public.wallets FOR DELETE
  USING (auth.uid() = user_id);

-- Wallet addresses inherit visibility from parent wallet
DROP POLICY IF EXISTS "wallet_addresses_select" ON public.wallet_addresses;

CREATE POLICY "wallet_addresses_select"
  ON public.wallet_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE id = wallet_id
      AND (
        -- Public wallets
        (is_active = true AND (
          (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects WHERE id = wallets.project_id AND status = 'active'
          ))
          OR (profile_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles WHERE id = wallets.profile_id
          ))
        ))
        -- Or owner
        OR auth.uid() = user_id
      )
    )
  );

-- ============================================================================
-- STEP 7: Helper view for easy querying (optional but useful)
-- ============================================================================

CREATE OR REPLACE VIEW wallets_with_totals AS
SELECT
  w.*,
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
  CASE
    WHEN w.goal_amount IS NOT NULL AND w.goal_amount > 0 THEN
      (w.balance_btc / w.goal_amount * 100)
    ELSE NULL
  END as progress_percent
FROM wallets w;

COMMENT ON VIEW wallets_with_totals IS 'Wallets with computed total balance and progress';

COMMIT;
