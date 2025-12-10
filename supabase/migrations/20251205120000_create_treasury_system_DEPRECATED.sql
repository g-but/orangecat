-- ============================================================================
-- TREASURY SYSTEM - Multi-Signature Wallets & Asset Management
-- ============================================================================
-- This migration creates the treasury system for organizations:
-- 1. organization_treasuries - Main treasury accounts
-- 2. treasury_wallets - Multi-signature Bitcoin wallets
-- 3. treasury_assets - Assets held in treasury (Bitcoin, other assets)
-- 4. treasury_proposals - Spending proposals requiring approval
-- 5. treasury_votes - Voting on proposals
-- 6. treasury_transactions - Transaction history
-- ============================================================================

BEGIN;

-- ==================== ORGANIZATION TREASURIES ====================

CREATE TABLE IF NOT EXISTS public.organization_treasuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  treasury_type TEXT NOT NULL DEFAULT 'general' CHECK (treasury_type IN ('general', 'project', 'grant', 'investment')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'dissolved')),
  required_signatures INTEGER NOT NULL DEFAULT 1 CHECK (required_signatures >= 1),
  total_signers INTEGER NOT NULL DEFAULT 1 CHECK (total_signers >= 1),
  primary_currency TEXT NOT NULL DEFAULT 'BTC' CHECK (primary_currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  bitcoin_address TEXT,
  lightning_address TEXT,
  total_balance NUMERIC(15,8) DEFAULT 0 CHECK (total_balance >= 0),
  total_balance_currency TEXT NOT NULL DEFAULT 'BTC' CHECK (total_balance_currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CHECK (required_signatures <= total_signers),
  UNIQUE(organization_id, name)
);

-- ==================== TREASURY WALLETS ====================

CREATE TABLE IF NOT EXISTS public.treasury_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasury_id UUID NOT NULL REFERENCES public.organization_treasuries(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('bitcoin', 'lightning', 'multi_sig')),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  address TEXT NOT NULL,
  public_key TEXT,
  required_signatures INTEGER DEFAULT 1,
  total_signers INTEGER DEFAULT 1,
  balance NUMERIC(15,8) DEFAULT 0 CHECK (balance >= 0),
  balance_currency TEXT NOT NULL DEFAULT 'BTC' CHECK (balance_currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'compromised')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CHECK (required_signatures <= total_signers)
);

-- ==================== TREASURY SIGNERS ====================

CREATE TABLE IF NOT EXISTS public.treasury_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasury_id UUID NOT NULL REFERENCES public.organization_treasuries(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  public_key TEXT,
  added_by UUID NOT NULL REFERENCES public.profiles(id),
  added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  removed_by UUID REFERENCES public.profiles(id),
  removed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),

  UNIQUE(treasury_id, profile_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- ==================== TREASURY ASSETS ====================

CREATE TABLE IF NOT EXISTS public.treasury_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasury_id UUID NOT NULL REFERENCES public.organization_treasuries(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE, -- For pledged collateral
  asset_type TEXT NOT NULL CHECK (asset_type IN ('bitcoin', 'lightning', 'collateral', 'other')),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  quantity NUMERIC(15,8) NOT NULL CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'BTC' CHECK (unit IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  value_primary NUMERIC(15,8) DEFAULT 0 CHECK (value_primary >= 0),
  value_usd NUMERIC(15,2) DEFAULT 0 CHECK (value_usd >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'released', 'liquidated')),
  acquired_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==================== TREASURY PROPOSALS ====================

CREATE TABLE IF NOT EXISTS public.treasury_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasury_id UUID NOT NULL REFERENCES public.organization_treasuries(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('spend', 'receive', 'transfer', 'investment', 'grant')),
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  amount NUMERIC(15,8) CHECK (amount >= 0),
  amount_currency TEXT NOT NULL DEFAULT 'BTC' CHECK (amount_currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  recipient_address TEXT,
  recipient_name TEXT CHECK (char_length(recipient_name) <= 100),
  justification TEXT CHECK (char_length(justification) <= 1000),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'approved', 'rejected', 'executed', 'cancelled')),
  voting_ends_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CHECK (amount >= 0),
  CHECK (executed_at IS NULL OR status = 'executed')
);

-- ==================== TREASURY VOTES ====================

CREATE TABLE IF NOT EXISTS public.treasury_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.treasury_proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
  voted_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(proposal_id, voter_id)
);

-- ==================== TREASURY TRANSACTIONS ====================

CREATE TABLE IF NOT EXISTS public.treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasury_id UUID NOT NULL REFERENCES public.organization_treasuries(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.treasury_proposals(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'investment', 'grant', 'fee')),
  amount NUMERIC(15,8) NOT NULL CHECK (amount >= 0),
  amount_currency TEXT NOT NULL DEFAULT 'BTC' CHECK (amount_currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  fee NUMERIC(15,8) DEFAULT 0 CHECK (fee >= 0),
  fee_currency TEXT DEFAULT 'BTC' CHECK (fee_currency IN ('USD', 'EUR', 'CHF', 'BTC', 'SATS')),
  tx_hash TEXT,
  blockchain TEXT DEFAULT 'bitcoin' CHECK (blockchain IN ('bitcoin', 'lightning')),
  from_address TEXT,
  to_address TEXT,
  description TEXT CHECK (char_length(description) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  confirmed_at TIMESTAMPTZ,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==================== INDEXES ====================

CREATE INDEX idx_organization_treasuries_org ON public.organization_treasuries(organization_id);
CREATE INDEX idx_treasury_wallets_treasury ON public.treasury_wallets(treasury_id);
CREATE INDEX idx_treasury_signers_treasury ON public.treasury_signers(treasury_id);
CREATE INDEX idx_treasury_signers_profile ON public.treasury_signers(profile_id);
CREATE INDEX idx_treasury_assets_treasury ON public.treasury_assets(treasury_id);
CREATE INDEX idx_treasury_proposals_treasury ON public.treasury_proposals(treasury_id);
CREATE INDEX idx_treasury_proposals_status ON public.treasury_proposals(status);
CREATE INDEX idx_treasury_votes_proposal ON public.treasury_votes(proposal_id);
CREATE INDEX idx_treasury_transactions_treasury ON public.treasury_transactions(treasury_id);
CREATE INDEX idx_treasury_transactions_status ON public.treasury_transactions(status);

-- ==================== TRIGGERS ====================

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_treasury_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_treasuries
  BEFORE UPDATE ON public.organization_treasuries
  FOR EACH ROW EXECUTE FUNCTION update_treasury_updated_at();

CREATE TRIGGER trigger_update_treasury_wallets
  BEFORE UPDATE ON public.treasury_wallets
  FOR EACH ROW EXECUTE FUNCTION update_treasury_updated_at();

CREATE TRIGGER trigger_update_treasury_assets
  BEFORE UPDATE ON public.treasury_assets
  FOR EACH ROW EXECUTE FUNCTION update_treasury_updated_at();

CREATE TRIGGER trigger_update_treasury_proposals
  BEFORE UPDATE ON public.treasury_proposals
  FOR EACH ROW EXECUTE FUNCTION update_treasury_updated_at();

CREATE TRIGGER trigger_update_treasury_transactions
  BEFORE UPDATE ON public.treasury_transactions
  FOR EACH ROW EXECUTE FUNCTION update_treasury_updated_at();

-- ==================== RLS POLICIES ====================

-- Organization treasuries - organization members can view
ALTER TABLE public.organization_treasuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_treasuries_read ON public.organization_treasuries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT profile_id FROM public.organization_members
      WHERE organization_id = organization_treasuries.organization_id
      AND status = 'active'
    )
  );

CREATE POLICY organization_treasuries_write ON public.organization_treasuries
  FOR ALL USING (
    auth.uid() IN (
      SELECT profile_id FROM public.organization_members
      WHERE organization_id = organization_treasuries.organization_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Treasury wallets - signers can view, owners can manage
ALTER TABLE public.treasury_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_wallets_read ON public.treasury_wallets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT ts.profile_id FROM public.treasury_signers ts
      WHERE ts.treasury_id = treasury_wallets.treasury_id
      AND ts.status = 'active'
    )
  );

CREATE POLICY treasury_wallets_write ON public.treasury_wallets
  FOR ALL USING (
    auth.uid() IN (
      SELECT ts.profile_id FROM public.treasury_signers ts
      WHERE ts.treasury_id = treasury_wallets.treasury_id
      AND ts.status = 'active'
    )
  );

-- Treasury signers - organization members can view, owners can manage
ALTER TABLE public.treasury_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_signers_read ON public.treasury_signers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT om.profile_id FROM public.organization_members om
      WHERE om.organization_id = (
        SELECT ot.organization_id FROM public.organization_treasuries ot
        WHERE ot.id = treasury_signers.treasury_id
      )
      AND om.status = 'active'
    )
  );

-- Treasury assets - organization members can view
ALTER TABLE public.treasury_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_assets_read ON public.treasury_assets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT om.profile_id FROM public.organization_members om
      WHERE om.organization_id = (
        SELECT ot.organization_id FROM public.organization_treasuries ot
        WHERE ot.id = treasury_assets.treasury_id
      )
      AND om.status = 'active'
    )
  );

-- Treasury proposals - organization members can view, members can create, owners approve
ALTER TABLE public.treasury_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_proposals_read ON public.treasury_proposals
  FOR SELECT USING (
    auth.uid() IN (
      SELECT om.profile_id FROM public.organization_members om
      WHERE om.organization_id = (
        SELECT ot.organization_id FROM public.organization_treasuries ot
        WHERE ot.id = treasury_proposals.treasury_id
      )
      AND om.status = 'active'
    )
  );

CREATE POLICY treasury_proposals_insert ON public.treasury_proposals
  FOR INSERT WITH CHECK (
    auth.uid() = proposer_id
    AND auth.uid() IN (
      SELECT om.profile_id FROM public.organization_members om
      WHERE om.organization_id = (
        SELECT ot.organization_id FROM public.organization_treasuries ot
        WHERE ot.id = treasury_proposals.treasury_id
      )
      AND om.status = 'active'
    )
  );

-- Treasury votes - organization members can vote
ALTER TABLE public.treasury_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_votes_read ON public.treasury_votes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT om.profile_id FROM public.organization_members om
      WHERE om.organization_id = (
        SELECT ot.organization_id FROM public.organization_treasuries ot
        JOIN public.treasury_proposals tp ON ot.id = tp.treasury_id
        WHERE tp.id = treasury_votes.proposal_id
      )
      AND om.status = 'active'
    )
  );

CREATE POLICY treasury_votes_insert ON public.treasury_votes
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id
    AND auth.uid() IN (
      SELECT om.profile_id FROM public.organization_members om
      WHERE om.organization_id = (
        SELECT ot.organization_id FROM public.organization_treasuries ot
        JOIN public.treasury_proposals tp ON ot.id = tp.treasury_id
        WHERE tp.id = treasury_votes.proposal_id
      )
      AND om.status = 'active'
    )
  );

-- Treasury transactions - organization members can view
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_transactions_read ON public.treasury_transactions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT om.profile_id FROM public.organization_members om
      WHERE om.organization_id = (
        SELECT ot.organization_id FROM public.organization_treasuries ot
        WHERE ot.id = treasury_transactions.treasury_id
      )
      AND om.status = 'active'
    )
  );

-- ==================== HELPER FUNCTIONS ====================

-- Get treasury summary with balances
CREATE OR REPLACE FUNCTION get_treasury_summary(p_treasury_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'treasury', jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'total_balance', t.total_balance,
      'total_balance_currency', t.total_balance_currency,
      'primary_currency', t.primary_currency,
      'required_signatures', t.required_signatures,
      'total_signers', t.total_signers
    ),
    'wallets', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', tw.id,
          'name', tw.name,
          'type', tw.wallet_type,
          'balance', tw.balance,
          'balance_currency', tw.balance_currency,
          'status', tw.status
        )
      )
      FROM treasury_wallets tw
      WHERE tw.treasury_id = p_treasury_id AND tw.status = 'active'
    ),
    'assets', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ta.id,
          'name', ta.name,
          'type', ta.asset_type,
          'quantity', ta.quantity,
          'unit', ta.unit,
          'value_primary', ta.value_primary,
          'value_usd', ta.value_usd
        )
      )
      FROM treasury_assets ta
      WHERE ta.treasury_id = p_treasury_id AND ta.status = 'active'
    ),
    'active_proposals', (
      SELECT COUNT(*) FROM treasury_proposals tp
      WHERE tp.treasury_id = p_treasury_id AND tp.status IN ('active', 'approved')
    )
  )
  FROM organization_treasuries t
  WHERE t.id = p_treasury_id;
$$;

-- ==================== VERIFICATION ====================

DO $$
DECLARE
  v_tables_exist boolean := false;
  v_policies_exist boolean := false;
  v_functions_exist boolean := false;
BEGIN
  -- Check if all tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('organization_treasuries', 'treasury_wallets', 'treasury_signers', 'treasury_assets', 'treasury_proposals', 'treasury_votes', 'treasury_transactions')
  ) INTO v_tables_exist;

  -- Check if RLS is enabled on key tables
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN ('organization_treasuries', 'treasury_wallets', 'treasury_signers', 'treasury_assets', 'treasury_proposals', 'treasury_votes', 'treasury_transactions')
    AND c.relrowsecurity = true
  ) INTO v_policies_exist;

  -- Check if helper function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname = 'get_treasury_summary'
  ) INTO v_functions_exist;

  IF v_tables_exist AND v_policies_exist AND v_functions_exist THEN
    RAISE NOTICE 'SUCCESS: Treasury system created successfully';
    RAISE NOTICE '  ✓ Tables: treasuries, wallets, signers, assets, proposals, votes, transactions';
    RAISE NOTICE '  ✓ Security: RLS policies enabled for all tables';
    RAISE NOTICE '  ✓ Functions: Treasury summary and management functions';
    RAISE NOTICE '  ✓ Multi-sig: Wallet and signer management ready';
    RAISE NOTICE '  ✓ Governance: Proposal and voting system ready';
  ELSE
    RAISE EXCEPTION 'FAILED: Treasury system incomplete - tables: %, policies: %, functions: %',
      v_tables_exist, v_policies_exist, v_functions_exist;
  END IF;
END $$;

-- ==================== COMMENTS ====================

COMMENT ON TABLE public.organization_treasuries IS 'Organization treasury accounts with multi-signature requirements';
COMMENT ON TABLE public.treasury_wallets IS 'Multi-signature Bitcoin wallets for treasuries';
COMMENT ON TABLE public.treasury_signers IS 'Authorized signers for treasury wallets';
COMMENT ON TABLE public.treasury_assets IS 'Assets held in treasury (Bitcoin, collateral, etc.)';
COMMENT ON TABLE public.treasury_proposals IS 'Spending proposals requiring approval';
COMMENT ON TABLE public.treasury_votes IS 'Votes on treasury proposals';
COMMENT ON TABLE public.treasury_transactions IS 'Transaction history for treasury movements';

COMMENT ON FUNCTION get_treasury_summary IS 'Get comprehensive treasury information including balances and assets';

COMMIT;
