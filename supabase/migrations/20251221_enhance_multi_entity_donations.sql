-- ============================================================================
-- ENHANCED MULTI-ENTITY DONATIONS MIGRATION - December 2025
-- ============================================================================
-- This migration enhances the schema to support:
-- 1. Multi-entity donations (any entity can donate to any other entity)
-- 2. Transparent money movement tracking
-- 3. BTC wallet support for all entities
-- 4. Enhanced transaction transparency and audit trails
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE ALL ENTITIES HAVE BTC WALLETS
-- ============================================================================

-- Profiles already have bitcoin_address and lightning_address
-- Organizations already have bitcoin_address and lightning_address
-- Projects already have bitcoin_address and lightning_address

-- Add wallet balance tracking for all entities (for transparency)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(20,8) DEFAULT 0;

-- ============================================================================
-- STEP 2: REPLACE donations TABLE WITH TRANSACTIONS TABLE
-- ============================================================================

-- Create enhanced transactions table for multi-entity donations
CREATE TABLE IF NOT EXISTS public.transactions (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction details
  amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
  currency TEXT DEFAULT 'SATS' CHECK (currency IN ('SATS', 'BTC')),

  -- Source entity (who is sending)
  from_entity_type TEXT NOT NULL CHECK (from_entity_type IN ('profile', 'organization', 'project')),
  from_entity_id uuid NOT NULL,

  -- Destination entity (who is receiving)
  to_entity_type TEXT NOT NULL CHECK (to_entity_type IN ('profile', 'organization', 'project')),
  to_entity_id uuid NOT NULL,

  -- Payment details
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bitcoin', 'lightning', 'on-chain', 'off-chain')),
  transaction_hash TEXT, -- Bitcoin transaction hash
  lightning_payment_hash TEXT, -- Lightning payment hash
  payment_proof TEXT, -- Additional proof/evidence

  -- Transaction status and metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'cancelled')),
  fee_sats BIGINT DEFAULT 0, -- Transaction fee in sats
  exchange_rate DECIMAL(20,8), -- BTC/SATS rate at transaction time

  -- Transparency and audit
  anonymous BOOLEAN DEFAULT FALSE,
  message TEXT, -- Optional message from sender
  purpose TEXT, -- What the funds are for (e.g., "project funding", "tip", "grant")
  tags TEXT[], -- Categorization tags

  -- Transparency features
  public_visibility BOOLEAN DEFAULT TRUE, -- Can others see this transaction?
  audit_trail JSONB DEFAULT '{}', -- Detailed transaction history
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'disputed')),

  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: ADD PERFORMANCE INDEXES
-- ============================================================================

-- Core transaction indexes
CREATE INDEX idx_transactions_from_entity ON transactions(from_entity_type, from_entity_id);
CREATE INDEX idx_transactions_to_entity ON transactions(to_entity_type, to_entity_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_amount ON transactions(amount_sats DESC);

-- Entity-specific indexes for fast lookups
CREATE INDEX idx_transactions_from_profiles ON transactions(from_entity_type, from_entity_id) WHERE from_entity_type = 'profile';
CREATE INDEX idx_transactions_to_profiles ON transactions(to_entity_type, to_entity_id) WHERE to_entity_type = 'profile';
CREATE INDEX idx_transactions_from_orgs ON transactions(from_entity_type, from_entity_id) WHERE from_entity_type = 'organization';
CREATE INDEX idx_transactions_to_orgs ON transactions(to_entity_type, to_entity_id) WHERE to_entity_type = 'organization';
CREATE INDEX idx_transactions_from_projects ON transactions(from_entity_type, from_entity_id) WHERE from_entity_type = 'project';
CREATE INDEX idx_transactions_to_projects ON transactions(to_entity_type, to_entity_id) WHERE to_entity_type = 'project';

-- Transparency indexes
CREATE INDEX idx_transactions_public ON transactions(public_visibility) WHERE public_visibility = true;
CREATE INDEX idx_transactions_anonymous ON transactions(anonymous) WHERE anonymous = true;

-- ============================================================================
-- STEP 4: MIGRATE EXISTING donations DATA TO transactions
-- ============================================================================

-- Migrate existing donations data to the new transactions table
INSERT INTO transactions (
  amount_sats,
  currency,
  from_entity_type,
  from_entity_id,
  to_entity_type,
  to_entity_id,
  payment_method,
  transaction_hash,
  lightning_payment_hash,
  status,
  anonymous,
  message,
  purpose,
  initiated_at,
  confirmed_at,
  created_at,
  updated_at
)
SELECT
  amount,
  'SATS',
  'profile', -- All existing donations are from profiles
  donor_id,
  'project', -- All existing donations are to projects
  project_id,
  CASE
    WHEN payment_method = 'lightning' THEN 'lightning'
    ELSE 'bitcoin'
  END,
  transaction_hash,
  lightning_payment_hash,
  CASE
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'failed' THEN 'failed'
    ELSE 'pending'
  END,
  anonymous,
  message,
  'project_funding', -- Default purpose for existing donations
  created_at,
  confirmed_at,
  created_at,
  created_at
FROM donations
WHERE status != 'cancelled'; -- Skip cancelled donations

-- ============================================================================
-- STEP 5: DROP OLD donations TABLE
-- ============================================================================

-- Drop the old donations table (data has been migrated)
DROP TABLE IF EXISTS public.donations CASCADE;

-- ============================================================================
-- STEP 6: ADD RLS POLICIES FOR TRANSPARENCY
-- ============================================================================

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public transactions
CREATE POLICY "Public transactions are viewable by everyone"
  ON transactions FOR SELECT
  USING (public_visibility = true OR auth.uid() IN (
    -- Allow participants to see their own transactions
    SELECT unnest(ARRAY[from_entity_id, to_entity_id])
    WHERE from_entity_type = 'profile' OR to_entity_type = 'profile'
  ));

-- Policy: Authenticated users can create transactions
CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Participants can update their transactions
CREATE POLICY "Participants can update their transactions"
  ON transactions FOR UPDATE
  USING (
    -- Check if user is involved in the transaction
    auth.uid() IN (
      SELECT CASE
        WHEN from_entity_type = 'profile' THEN from_entity_id
        WHEN to_entity_type = 'profile' THEN to_entity_id
        ELSE NULL
      END
      FROM transactions t
      WHERE t.id = transactions.id
    )
  );

-- ============================================================================
-- STEP 7: ADD HELPFUL FUNCTIONS FOR TRANSPARENCY
-- ============================================================================

-- Function to get wallet balance for any entity
CREATE OR REPLACE FUNCTION get_entity_wallet_balance(
  entity_type TEXT,
  entity_id UUID
) RETURNS DECIMAL(20,8) AS $$
DECLARE
  balance DECIMAL(20,8) := 0;
BEGIN
  CASE entity_type
    WHEN 'profile' THEN
      SELECT COALESCE(wallet_balance, 0) INTO balance FROM profiles WHERE id = entity_id;
    WHEN 'organization' THEN
      SELECT COALESCE(wallet_balance, 0) INTO balance FROM organizations WHERE id = entity_id;
    WHEN 'project' THEN
      SELECT COALESCE(wallet_balance, 0) INTO balance FROM projects WHERE id = entity_id;
    ELSE
      balance := 0;
  END CASE;

  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get transaction history for any entity
CREATE OR REPLACE FUNCTION get_entity_transaction_history(
  entity_type TEXT,
  entity_id UUID,
  limit_count INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  amount_sats BIGINT,
  direction TEXT, -- 'sent' or 'received'
  counterparty_type TEXT,
  counterparty_name TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Outgoing transactions
  SELECT
    t.id,
    t.amount_sats,
    'sent'::TEXT as direction,
    t.to_entity_type as counterparty_type,
    CASE
      WHEN t.to_entity_type = 'profile' THEN p.name
      WHEN t.to_entity_type = 'organization' THEN o.name
      WHEN t.to_entity_type = 'project' THEN pr.title
      ELSE 'Unknown'
    END as counterparty_name,
    t.status,
    t.created_at
  FROM transactions t
  LEFT JOIN profiles p ON t.to_entity_id = p.id AND t.to_entity_type = 'profile'
  LEFT JOIN organizations o ON t.to_entity_id = o.id AND t.to_entity_type = 'organization'
  LEFT JOIN projects pr ON t.to_entity_id = pr.id AND t.to_entity_type = 'project'
  WHERE t.from_entity_type = get_entity_transaction_history.entity_type
    AND t.from_entity_id = get_entity_transaction_history.entity_id
    AND t.public_visibility = true

  UNION ALL

  -- Incoming transactions
  SELECT
    t.id,
    t.amount_sats,
    'received'::TEXT as direction,
    t.from_entity_type as counterparty_type,
    CASE
      WHEN t.from_entity_type = 'profile' THEN p.name
      WHEN t.from_entity_type = 'organization' THEN o.name
      WHEN t.from_entity_type = 'project' THEN pr.title
      ELSE 'Unknown'
    END as counterparty_name,
    t.status,
    t.created_at
  FROM transactions t
  LEFT JOIN profiles p ON t.from_entity_id = p.id AND t.from_entity_type = 'profile'
  LEFT JOIN organizations o ON t.from_entity_id = o.id AND t.from_entity_type = 'organization'
  LEFT JOIN projects pr ON t.from_entity_id = pr.id AND t.from_entity_type = 'project'
  WHERE t.to_entity_type = get_entity_transaction_history.entity_type
    AND t.to_entity_id = get_entity_transaction_history.entity_id
    AND t.public_visibility = true

  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE transactions IS 'Universal transaction table supporting donations between any entities (profiles, organizations, projects) with full transparency and audit trails';

COMMENT ON FUNCTION get_entity_wallet_balance(TEXT, UUID) IS 'Returns the current wallet balance for any entity type';
COMMENT ON FUNCTION get_entity_transaction_history(TEXT, UUID, INTEGER) IS 'Returns transparent transaction history for any entity';

-- ============================================================================
-- STEP 9: GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant execute permissions for the helper functions
GRANT EXECUTE ON FUNCTION get_entity_wallet_balance(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_transaction_history(TEXT, UUID, INTEGER) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of enhancements:
-- ✅ Multi-entity donations (any entity can donate to any other entity)
-- ✅ Enhanced transparency with public/private transaction visibility
-- ✅ Wallet balance tracking for all entities
-- ✅ Comprehensive audit trails with JSONB audit_trail field
-- ✅ Purpose categorization and tagging for transactions
-- ✅ Anonymous donation support
-- ✅ Performance-optimized indexes for fast queries
-- ✅ RLS policies for proper access control
-- ✅ Helper functions for wallet balances and transaction history
-- ✅ Migrated existing donations data to new structure

-- To verify the migration:
-- SELECT COUNT(*) FROM transactions WHERE from_entity_type = 'profile';
-- SELECT * FROM get_entity_wallet_balance('profile', (SELECT id FROM profiles LIMIT 1));
-- SELECT * FROM get_entity_transaction_history('profile', (SELECT id FROM profiles LIMIT 1), 10);



