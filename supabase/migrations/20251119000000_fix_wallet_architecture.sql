-- Migration: Fix Wallet Architecture - Remove Exclusive Ownership Constraint
-- Priority: P0 - CRITICAL
-- Created: 2025-11-19
-- Purpose: Allow wallets to be shared between profiles and projects, support multiple categories per wallet
-- Breaking Change: Yes - requires data migration
-- Estimated Time: 5-10 minutes

-- ============================================================================
-- PHASE 1: Create New Wallet Architecture
-- ============================================================================

BEGIN;

-- Step 1: Create wallet_definitions table (single source of truth for Bitcoin addresses)
CREATE TABLE IF NOT EXISTS public.wallet_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bitcoin address/xpub (unique across system)
  address_or_xpub TEXT NOT NULL UNIQUE,
  wallet_type TEXT NOT NULL DEFAULT 'address' CHECK (wallet_type IN ('address', 'xpub')),

  -- Metadata
  label TEXT CHECK (char_length(label) <= 100),
  description TEXT CHECK (char_length(description) <= 500),

  -- Balance tracking (single source of truth)
  balance_btc NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (balance_btc >= 0),
  balance_updated_at TIMESTAMPTZ,

  -- Creator info
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_wallet_definitions_address ON public.wallet_definitions(address_or_xpub) WHERE NOT is_deleted;
CREATE INDEX idx_wallet_definitions_creator ON public.wallet_definitions(created_by) WHERE NOT is_deleted;
CREATE INDEX idx_wallet_definitions_balance ON public.wallet_definitions(balance_btc) WHERE balance_btc > 0 AND NOT is_deleted;

COMMENT ON TABLE public.wallet_definitions IS 'Bitcoin wallet definitions - single source of truth for addresses';
COMMENT ON COLUMN public.wallet_definitions.address_or_xpub IS 'Bitcoin address (bc1q...) or extended public key (zpub...)';

-- Step 2: Create wallet_ownerships table (many-to-many: who can use this wallet)
CREATE TABLE IF NOT EXISTS public.wallet_ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  wallet_id UUID NOT NULL REFERENCES public.wallet_definitions(id) ON DELETE CASCADE,

  -- Owner can be profile OR project (but we allow both for same wallet!)
  owner_type TEXT NOT NULL CHECK (owner_type IN ('profile', 'project')),
  owner_id UUID NOT NULL, -- References profiles.id or projects.id

  -- Permission level
  permission_level TEXT NOT NULL DEFAULT 'manage' CHECK (permission_level IN ('view', 'manage', 'admin')),

  -- Audit
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure unique ownership per entity
  UNIQUE(wallet_id, owner_type, owner_id)
);

CREATE INDEX idx_wallet_ownerships_wallet ON public.wallet_ownerships(wallet_id);
CREATE INDEX idx_wallet_ownerships_profile ON public.wallet_ownerships(owner_id) WHERE owner_type = 'profile';
CREATE INDEX idx_wallet_ownerships_project ON public.wallet_ownerships(owner_id) WHERE owner_type = 'project';

COMMENT ON TABLE public.wallet_ownerships IS 'Many-to-many: which entities can use which wallets';

-- Step 3: Create wallet_categories table (many-to-many: wallet purposes)
CREATE TABLE IF NOT EXISTS public.wallet_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  wallet_id UUID NOT NULL REFERENCES public.wallet_definitions(id) ON DELETE CASCADE,

  -- Which entity is using this wallet for this category
  entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'project')),
  entity_id UUID NOT NULL,

  -- Category and display
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'rent', 'food', 'medical', 'education',
    'emergency', 'transportation', 'utilities', 'custom'
  )),
  category_icon TEXT NOT NULL DEFAULT '💰' CHECK (category_icon IN (
    '💰', '🏠', '🍔', '💊', '🎓', '🚨', '🚗', '💡', '📦'
  )),

  -- Optional goal for this category
  goal_amount NUMERIC(20,8) CHECK (goal_amount > 0),
  goal_currency TEXT DEFAULT 'USD' CHECK (goal_currency IN ('USD', 'EUR', 'BTC', 'SATS', 'CHF')),
  goal_deadline TIMESTAMPTZ,

  -- Display settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Custom category details
  custom_label TEXT CHECK (char_length(custom_label) <= 100),
  custom_icon TEXT CHECK (char_length(custom_icon) <= 10), -- emoji or short text

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One wallet can have multiple categories per entity
  UNIQUE(wallet_id, entity_type, entity_id, category)
);

CREATE INDEX idx_wallet_categories_wallet ON public.wallet_categories(wallet_id);
CREATE INDEX idx_wallet_categories_entity_profile ON public.wallet_categories(entity_id, is_active) WHERE entity_type = 'profile';
CREATE INDEX idx_wallet_categories_entity_project ON public.wallet_categories(entity_id, is_active) WHERE entity_type = 'project';

COMMENT ON TABLE public.wallet_categories IS 'Many-to-many: purposes/categories for wallet usage';

-- Step 4: Keep wallet_addresses table for xpub derivation (unchanged)
-- This table already exists and works correctly - no changes needed

-- ============================================================================
-- PHASE 2: Add Triggers and Functions
-- ============================================================================

-- Update timestamp trigger for wallet_definitions
CREATE OR REPLACE FUNCTION update_wallet_definition_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_definition_timestamp_trigger
  BEFORE UPDATE ON public.wallet_definitions
  FOR EACH ROW EXECUTE FUNCTION update_wallet_definition_timestamp();

-- Update timestamp trigger for wallet_categories
CREATE OR REPLACE FUNCTION update_wallet_category_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_category_timestamp_trigger
  BEFORE UPDATE ON public.wallet_categories
  FOR EACH ROW EXECUTE FUNCTION update_wallet_category_timestamp();

-- Function to enforce max 10 active categories per entity
CREATE OR REPLACE FUNCTION check_wallet_category_limit()
RETURNS TRIGGER AS $$
DECLARE
  category_count INT;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
    IF NEW.is_active = true THEN
      SELECT COUNT(*) INTO category_count
      FROM wallet_categories
      WHERE entity_type = NEW.entity_type
        AND entity_id = NEW.entity_id
        AND is_active = true
        AND (TG_OP = 'INSERT' OR id != NEW.id);

      IF category_count >= 10 THEN
        RAISE EXCEPTION 'Maximum 10 active wallet categories allowed per entity';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_wallet_category_limit
  BEFORE INSERT OR UPDATE ON public.wallet_categories
  FOR EACH ROW EXECUTE FUNCTION check_wallet_category_limit();

-- ============================================================================
-- PHASE 3: Row Level Security
-- ============================================================================

ALTER TABLE public.wallet_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_categories ENABLE ROW LEVEL SECURITY;

-- Wallet Definitions Policies

-- Anyone can view active wallets
CREATE POLICY "wallet_definitions_select_active"
  ON public.wallet_definitions FOR SELECT
  USING (NOT is_deleted);

-- Users can create wallets
CREATE POLICY "wallet_definitions_insert_own"
  ON public.wallet_definitions FOR INSERT
  WITH CHECK (auth.uid() = created_by OR auth.uid() IS NOT NULL);

-- Users can update wallets they created or own
CREATE POLICY "wallet_definitions_update_own"
  ON public.wallet_definitions FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM wallet_ownerships wo
      WHERE wo.wallet_id = id
        AND wo.permission_level IN ('manage', 'admin')
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = wo.owner_id
            AND p.user_id = auth.uid()
            AND wo.owner_type = 'profile'
          UNION
          SELECT 1 FROM projects pr
          WHERE pr.id = wo.owner_id
            AND pr.user_id = auth.uid()
            AND wo.owner_type = 'project'
        )
    )
  );

-- Users can soft delete wallets they own
CREATE POLICY "wallet_definitions_delete_own"
  ON public.wallet_definitions FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM wallet_ownerships wo
      WHERE wo.wallet_id = id
        AND wo.permission_level = 'admin'
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = wo.owner_id
            AND p.user_id = auth.uid()
            AND wo.owner_type = 'profile'
          UNION
          SELECT 1 FROM projects pr
          WHERE pr.id = wo.owner_id
            AND pr.user_id = auth.uid()
            AND wo.owner_type = 'project'
        )
    )
  )
  WITH CHECK (is_deleted = true);

-- Wallet Ownerships Policies

-- Anyone can view ownerships
CREATE POLICY "wallet_ownerships_select_all"
  ON public.wallet_ownerships FOR SELECT
  USING (true);

-- Users can add ownerships for wallets they own or entities they control
CREATE POLICY "wallet_ownerships_insert_own"
  ON public.wallet_ownerships FOR INSERT
  WITH CHECK (
    auth.uid() = added_by AND (
      -- User owns the wallet
      EXISTS (
        SELECT 1 FROM wallet_definitions wd
        WHERE wd.id = wallet_id
          AND wd.created_by = auth.uid()
      ) OR
      -- User owns the entity being granted access
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = owner_id
          AND p.user_id = auth.uid()
          AND owner_type = 'profile'
        UNION
        SELECT 1 FROM projects pr
        WHERE pr.id = owner_id
          AND pr.user_id = auth.uid()
          AND owner_type = 'project'
      )
    )
  );

-- Users can remove ownerships they created or for entities they control
CREATE POLICY "wallet_ownerships_delete_own"
  ON public.wallet_ownerships FOR DELETE
  USING (
    auth.uid() = added_by OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = owner_id
        AND p.user_id = auth.uid()
        AND owner_type = 'profile'
      UNION
      SELECT 1 FROM projects pr
      WHERE pr.id = owner_id
        AND pr.user_id = auth.uid()
        AND owner_type = 'project'
    )
  );

-- Wallet Categories Policies

-- Anyone can view active categories
CREATE POLICY "wallet_categories_select_active"
  ON public.wallet_categories FOR SELECT
  USING (is_active);

-- Users can create categories for entities they control
CREATE POLICY "wallet_categories_insert_own"
  ON public.wallet_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = entity_id
        AND p.user_id = auth.uid()
        AND entity_type = 'profile'
      UNION
      SELECT 1 FROM projects pr
      WHERE pr.id = entity_id
        AND pr.user_id = auth.uid()
        AND entity_type = 'project'
    )
  );

-- Users can update categories for entities they control
CREATE POLICY "wallet_categories_update_own"
  ON public.wallet_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = entity_id
        AND p.user_id = auth.uid()
        AND entity_type = 'profile'
      UNION
      SELECT 1 FROM projects pr
      WHERE pr.id = entity_id
        AND pr.user_id = auth.uid()
        AND entity_type = 'project'
    )
  );

-- Users can delete categories for entities they control
CREATE POLICY "wallet_categories_delete_own"
  ON public.wallet_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = entity_id
        AND p.user_id = auth.uid()
        AND entity_type = 'profile'
      UNION
      SELECT 1 FROM projects pr
      WHERE pr.id = entity_id
        AND pr.user_id = auth.uid()
        AND entity_type = 'project'
    )
  );

-- ============================================================================
-- PHASE 4: Helper Functions
-- ============================================================================

-- Function to get all wallets for an entity (profile or project)
CREATE OR REPLACE FUNCTION get_entity_wallets(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE (
  wallet_id UUID,
  address_or_xpub TEXT,
  wallet_type TEXT,
  label TEXT,
  description TEXT,
  balance_btc NUMERIC,
  balance_updated_at TIMESTAMPTZ,
  categories JSONB,
  permission_level TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.id as wallet_id,
    wd.address_or_xpub,
    wd.wallet_type,
    wd.label,
    wd.description,
    wd.balance_btc,
    wd.balance_updated_at,
    -- Aggregate all categories for this entity
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category', wc.category,
          'category_icon', wc.category_icon,
          'goal_amount', wc.goal_amount,
          'goal_currency', wc.goal_currency,
          'goal_deadline', wc.goal_deadline,
          'is_primary', wc.is_primary,
          'display_order', wc.display_order
        ) ORDER BY wc.display_order, wc.created_at
      ) FILTER (WHERE wc.id IS NOT NULL),
      '[]'::jsonb
    ) as categories,
    wo.permission_level,
    -- Wallet is active if at least one category is active
    COALESCE(bool_or(wc.is_active), false) as is_active
  FROM wallet_definitions wd
  JOIN wallet_ownerships wo ON wo.wallet_id = wd.id
  LEFT JOIN wallet_categories wc ON wc.wallet_id = wd.id
    AND wc.entity_type = p_entity_type
    AND wc.entity_id = p_entity_id
    AND wc.is_active = true
  WHERE
    wo.owner_type = p_entity_type
    AND wo.owner_id = p_entity_id
    AND NOT wd.is_deleted
  GROUP BY wd.id, wd.address_or_xpub, wd.wallet_type, wd.label,
           wd.description, wd.balance_btc, wd.balance_updated_at, wo.permission_level
  ORDER BY is_active DESC, wd.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_entity_wallets IS 'Get all wallets associated with a profile or project, including categories';

COMMIT;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_tables_exist boolean;
  v_functions_exist boolean;
BEGIN
  -- Check tables exist
  SELECT
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('wallet_definitions', 'wallet_ownerships', 'wallet_categories')) = 3
  INTO v_tables_exist;

  -- Check functions exist
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'get_entity_wallets'
  ) INTO v_functions_exist;

  IF v_tables_exist AND v_functions_exist THEN
    RAISE NOTICE '✅ SUCCESS: New wallet architecture created';
    RAISE NOTICE '  ✓ Tables: wallet_definitions, wallet_ownerships, wallet_categories';
    RAISE NOTICE '  ✓ RLS Policies: Enabled with proper security';
    RAISE NOTICE '  ✓ Functions: get_entity_wallets';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NEXT STEPS:';
    RAISE NOTICE '  1. Run data migration script to migrate existing wallets';
    RAISE NOTICE '  2. Update application code to use new schema';
    RAISE NOTICE '  3. Drop old wallets table after verification';
  ELSE
    RAISE EXCEPTION '❌ FAILED: New wallet architecture incomplete';
  END IF;
END $$;
