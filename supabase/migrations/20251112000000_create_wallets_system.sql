-- Migration: Simple Multi-Wallet System
-- Allows profiles and projects to have multiple categorized wallets
-- Date: 2025-11-12

BEGIN;

-- ============================================================================
-- STEP 1: Create wallets table (works for both profiles and projects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (either profile OR project, never both)
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Wallet info
  label TEXT NOT NULL,  -- User-friendly name: "Rent", "Food", "Medical"
  description TEXT,  -- Optional: "Help me cover monthly housing costs"

  -- Bitcoin address/xpub
  address_or_xpub TEXT NOT NULL,  -- Can be single address OR xpub/ypub/zpub
  wallet_type TEXT DEFAULT 'address' CHECK (wallet_type IN ('address', 'xpub')),

  -- Category (predefined + custom)
  category TEXT DEFAULT 'general',  -- 'rent', 'food', 'medical', 'education', 'emergency', 'general', 'custom'
  category_icon TEXT DEFAULT '💰',  -- Emoji for UI

  -- Optional goal
  goal_amount NUMERIC(20,8),
  goal_currency TEXT DEFAULT 'USD',  -- USD, EUR, BTC, SATS
  goal_deadline TIMESTAMPTZ,  -- Optional deadline

  -- Balance tracking
  balance_btc NUMERIC(20,8) DEFAULT 0 NOT NULL,
  balance_updated_at TIMESTAMPTZ,

  -- Display settings
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,  -- First wallet created = primary

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT check_has_owner CHECK (
    (profile_id IS NOT NULL AND project_id IS NULL) OR
    (profile_id IS NULL AND project_id IS NOT NULL)
  ),
  CONSTRAINT check_max_10_wallets CHECK (
    CASE
      WHEN profile_id IS NOT NULL THEN
        (SELECT COUNT(*) FROM wallets WHERE profile_id = wallets.profile_id AND is_active = true) <= 10
      WHEN project_id IS NOT NULL THEN
        (SELECT COUNT(*) FROM wallets WHERE project_id = wallets.project_id AND is_active = true) <= 10
    END
  )
);

COMMENT ON TABLE public.wallets IS 'Multi-purpose wallets for both profiles and projects';
COMMENT ON COLUMN public.wallets.address_or_xpub IS 'Bitcoin address (bc1q...) or extended public key (zpub...)';
COMMENT ON COLUMN public.wallets.wallet_type IS 'address = single address, xpub = extended public key (auto-derives addresses)';

-- Indexes
CREATE INDEX idx_wallets_profile ON public.wallets(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_wallets_project ON public.wallets(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_wallets_active ON public.wallets(is_active) WHERE is_active = true;

-- ============================================================================
-- STEP 2: Create wallet_addresses table (for xpub address derivation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,

  address TEXT NOT NULL,
  derivation_index INT NOT NULL,  -- Child index: 0, 1, 2, ...

  balance_btc NUMERIC(20,8) DEFAULT 0,
  tx_count INT DEFAULT 0,
  last_tx_at TIMESTAMPTZ,

  discovered_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_wallet_address UNIQUE(wallet_id, address)
);

COMMENT ON TABLE public.wallet_addresses IS 'Derived addresses from xpub wallets (auto-populated)';

CREATE INDEX idx_wallet_addresses_wallet ON public.wallet_addresses(wallet_id);
CREATE INDEX idx_wallet_addresses_has_balance ON public.wallet_addresses(wallet_id, balance_btc) WHERE balance_btc > 0;

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;

-- Wallets policies
DROP POLICY IF EXISTS "wallets_select_public" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_delete_own" ON public.wallets;

-- Public can view active wallets for active projects
CREATE POLICY "wallets_select_public"
  ON public.wallets FOR SELECT
  USING (
    is_active = true AND (
      -- Public can see wallets for active projects
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM projects WHERE id = wallets.project_id AND status = 'active'
      ))
      -- Public can see wallets for public profiles
      OR (profile_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles WHERE id = wallets.profile_id
      ))
    )
  );

-- Users can view their own wallets (any status)
CREATE POLICY "wallets_select_own"
  ON public.wallets FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    OR auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );

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
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    OR auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );

-- Users can delete their own wallets
CREATE POLICY "wallets_delete_own"
  ON public.wallets FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    OR auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );

-- Wallet addresses policies (inherit from parent wallet)
DROP POLICY IF EXISTS "wallet_addresses_select" ON public.wallet_addresses;

CREATE POLICY "wallet_addresses_select"
  ON public.wallet_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wallets WHERE id = wallet_id AND (
        -- Public can see addresses for public wallets
        (is_active = true AND (
          (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects WHERE id = wallets.project_id AND status = 'active'
          ))
          OR (profile_id IS NOT NULL)
        ))
        -- Or owner can see their own
        OR auth.uid() = (SELECT user_id FROM profiles WHERE id = wallets.profile_id)
        OR auth.uid() = (SELECT user_id FROM projects WHERE id = wallets.project_id)
      )
    )
  );

-- ============================================================================
-- STEP 4: Create helper function to get total balance
-- ============================================================================

CREATE OR REPLACE FUNCTION get_wallet_total_balance(wallet_uuid UUID)
RETURNS NUMERIC(20,8) AS $$
DECLARE
  wallet_type_val TEXT;
  balance NUMERIC(20,8);
BEGIN
  -- Get wallet type
  SELECT wallet_type INTO wallet_type_val FROM wallets WHERE id = wallet_uuid;

  IF wallet_type_val = 'address' THEN
    -- Single address wallet - return stored balance
    SELECT balance_btc INTO balance FROM wallets WHERE id = wallet_uuid;
  ELSE
    -- xpub wallet - sum all derived addresses
    SELECT COALESCE(SUM(balance_btc), 0) INTO balance
    FROM wallet_addresses WHERE wallet_id = wallet_uuid;
  END IF;

  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Add function to get entity total (profile or project)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_entity_total_balance(
  entity_type TEXT,  -- 'profile' or 'project'
  entity_uuid UUID
)
RETURNS NUMERIC(20,8) AS $$
DECLARE
  total NUMERIC(20,8);
BEGIN
  IF entity_type = 'profile' THEN
    SELECT COALESCE(SUM(balance_btc), 0) INTO total
    FROM wallets
    WHERE profile_id = entity_uuid AND is_active = true;
  ELSIF entity_type = 'project' THEN
    SELECT COALESCE(SUM(balance_btc), 0) INTO total
    FROM wallets
    WHERE project_id = entity_uuid AND is_active = true;
  ELSE
    RETURN 0;
  END IF;

  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
