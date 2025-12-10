-- Assets and Loan Collateral schema
-- Creates user-owned assets that can optionally be used as collateral for loans.

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================
-- Table: public.assets
-- =============================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('real_estate', 'business', 'vehicle', 'equipment', 'securities', 'other')),
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT NULL,
  location TEXT NULL,
  estimated_value NUMERIC NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  documents JSONB NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'user_provided', 'third_party_verified')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  public_visibility BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_owner ON public.assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_visibility ON public.assets(public_visibility);

-- RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Policies: Owner full access; others: no access by default
DROP POLICY IF EXISTS assets_owner_select ON public.assets;
CREATE POLICY assets_owner_select ON public.assets
  FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS assets_owner_insert ON public.assets;
CREATE POLICY assets_owner_insert ON public.assets
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS assets_owner_update ON public.assets;
CREATE POLICY assets_owner_update ON public.assets
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS assets_owner_delete ON public.assets;
CREATE POLICY assets_owner_delete ON public.assets
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Optional: allow public read for visible assets (commented out by default)
-- CREATE POLICY assets_public_read ON public.assets
--   FOR SELECT USING (public_visibility = TRUE);

-- =============================
-- Table: public.loan_collateral
-- =============================
CREATE TABLE IF NOT EXISTS public.loan_collateral (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pledged_value NUMERIC NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_collateral_loan ON public.loan_collateral(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_collateral_owner ON public.loan_collateral(owner_id);

ALTER TABLE public.loan_collateral ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loan_collateral_owner_select ON public.loan_collateral;
CREATE POLICY loan_collateral_owner_select ON public.loan_collateral
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS loan_collateral_owner_insert ON public.loan_collateral;
CREATE POLICY loan_collateral_owner_insert ON public.loan_collateral
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS loan_collateral_owner_delete ON public.loan_collateral;
CREATE POLICY loan_collateral_owner_delete ON public.loan_collateral
  FOR DELETE USING (auth.uid() = owner_id);

-- Note: updates can be added later with business rules

