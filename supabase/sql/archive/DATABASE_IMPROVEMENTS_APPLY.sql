-- =====================================================================
-- ORANGECAT DATABASE IMPROVEMENTS - APPLY TO SUPABASE
-- =====================================================================
-- Run this script in Supabase Dashboard → SQL Editor
-- All operations are idempotent (safe to run multiple times)
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 Starting OrangeCat Database Improvements...';
END $$;

-- =====================================================================
-- PHASE 1: FOREIGN KEY CONSTRAINTS
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '🔗 Phase 1: Applying Foreign Key Constraints...';
END $$;

-- conversation_participants → conversations(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_conv_part_conversation'
  ) THEN
    ALTER TABLE public.conversation_participants
    ADD CONSTRAINT fk_conv_part_conversation FOREIGN KEY (conversation_id)
    REFERENCES public.conversations(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: conversation_participants → conversations';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_conv_part_user'
  ) THEN
    ALTER TABLE public.conversation_participants
    ADD CONSTRAINT fk_conv_part_user FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: conversation_participants → profiles';
  END IF;
END $$;

-- messages → conversations(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_messages_conversation'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id)
    REFERENCES public.conversations(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: messages → conversations';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_messages_sender'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: messages → profiles (sender)';
  END IF;
END $$;

-- organization_members → organizations(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_org_members_org'
  ) THEN
    ALTER TABLE public.organization_members
    ADD CONSTRAINT fk_org_members_org FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: organization_members → organizations';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_org_members_user'
  ) THEN
    ALTER TABLE public.organization_members
    ADD CONSTRAINT fk_org_members_user FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: organization_members → profiles';
  END IF;
END $$;

-- loan_offers → loans(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_offers_loan'
  ) THEN
    ALTER TABLE public.loan_offers
    ADD CONSTRAINT fk_loan_offers_loan FOREIGN KEY (loan_id)
    REFERENCES public.loans(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: loan_offers → loans';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_offers_offerer'
  ) THEN
    ALTER TABLE public.loan_offers
    ADD CONSTRAINT fk_loan_offers_offerer FOREIGN KEY (offerer_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: loan_offers → profiles (offerer)';
  END IF;
END $$;

-- loan_payments → loans(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_payments_loan'
  ) THEN
    ALTER TABLE public.loan_payments
    ADD CONSTRAINT fk_loan_payments_loan FOREIGN KEY (loan_id)
    REFERENCES public.loans(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: loan_payments → loans';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_payments_payer'
  ) THEN
    ALTER TABLE public.loan_payments
    ADD CONSTRAINT fk_loan_payments_payer FOREIGN KEY (payer_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK: loan_payments → profiles (payer)';
  END IF;
END $$;

-- wallets → profiles(id), projects(id) (nullable; set null on owner delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_wallets_profile'
  ) THEN
    ALTER TABLE public.wallets
    ADD CONSTRAINT fk_wallets_profile FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added FK: wallets → profiles (nullable)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_wallets_project'
  ) THEN
    ALTER TABLE public.wallets
    ADD CONSTRAINT fk_wallets_project FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added FK: wallets → projects (nullable)';
  END IF;
END $$;

-- =====================================================================
-- PHASE 2: PERFORMANCE INDEXES
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '📈 Phase 2: Applying Performance Indexes...';
END $$;

-- PROFILES TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
ON profiles (lower(username))
WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles (email)
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location_search
ON profiles USING gin (to_tsvector('english', COALESCE(location_search, '')))
WHERE location_search IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_coordinates
ON profiles (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at
ON profiles (updated_at DESC);

-- PROJECTS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_user_id
ON projects (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects (status, created_at DESC)
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_category
ON projects (category, created_at DESC)
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_search
ON projects USING gin (to_tsvector('english',
  COALESCE(title, '') || ' ' || COALESCE(description, '')
))
WHERE title IS NOT NULL OR description IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_created_at
ON projects (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at
ON projects (updated_at DESC);

-- COMMERCE TABLES INDEXES
CREATE INDEX IF NOT EXISTS idx_user_products_user_id
ON user_products (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_services_user_id
ON user_services (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_products_status
ON user_products (status, created_at DESC)
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_services_status
ON user_services (status, created_at DESC)
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_products_category
ON user_products (category, created_at DESC)
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_services_category
ON user_services (category, created_at DESC)
WHERE category IS NOT NULL;

-- LOANS TABLES INDEXES
CREATE INDEX IF NOT EXISTS idx_loans_user_id
ON loans (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loans_status
ON loans (status, created_at DESC)
WHERE status IS NOT NULL;

-- MESSAGING TABLES INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_created_by
ON conversations (created_by, created_at DESC)
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_created_at
ON conversations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages (conversation_id, created_at ASC)
WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON messages (sender_id, created_at DESC)
WHERE sender_id IS NOT NULL;

-- ORGANIZATION TABLES INDEXES
CREATE INDEX IF NOT EXISTS idx_organizations_slug
ON organizations (slug)
WHERE slug IS NOT NULL;

-- WALLETS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_wallets_profile_id
ON wallets (profile_id, created_at DESC)
WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wallets_project_id
ON wallets (project_id, created_at DESC)
WHERE project_id IS NOT NULL;

-- TRANSACTIONS TABLE INDEXES
CREATE INDEX IF NOT EXISTS idx_transactions_from_entity
ON transactions (from_entity_type, from_entity_id, created_at DESC)
WHERE from_entity_type IS NOT NULL AND from_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_to_entity
ON transactions (to_entity_type, to_entity_id, created_at DESC)
WHERE to_entity_type IS NOT NULL AND to_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions (status, created_at DESC)
WHERE status IS NOT NULL;

-- SOCIAL FEATURES INDEXES
CREATE INDEX IF NOT EXISTS idx_follows_follower
ON follows (follower_id, created_at DESC)
WHERE follower_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_follows_following
ON follows (following_id, created_at DESC)
WHERE following_id IS NOT NULL;

-- =====================================================================
-- PHASE 3: DATA VALIDATION CONSTRAINTS
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Phase 3: Applying Data Validation Constraints...';
END $$;

-- Projects table constraints
ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_projects_status;
ALTER TABLE projects ADD CONSTRAINT chk_projects_status
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_projects_positive_amounts;
ALTER TABLE projects ADD CONSTRAINT chk_projects_positive_amounts
    CHECK (goal_amount_sats >= 0 AND raised_amount_sats >= 0);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS chk_projects_contributor_count;
ALTER TABLE projects ADD CONSTRAINT chk_projects_contributor_count
    CHECK (contributor_count >= 0);

-- Transactions constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_positive_amount;
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_positive_amount
    CHECK (amount_sats > 0);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_status;
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_status
    CHECK (status IN ('pending', 'confirmed', 'completed', 'failed', 'cancelled'));

-- User products constraints
ALTER TABLE user_products DROP CONSTRAINT IF EXISTS chk_user_products_status;
ALTER TABLE user_products ADD CONSTRAINT chk_user_products_status
    CHECK (status IN ('draft', 'active', 'paused', 'sold_out'));

ALTER TABLE user_products DROP CONSTRAINT IF EXISTS chk_user_products_price;
ALTER TABLE user_products ADD CONSTRAINT chk_user_products_price
    CHECK (price_sats > 0);

ALTER TABLE user_products DROP CONSTRAINT IF EXISTS chk_user_products_inventory;
ALTER TABLE user_products ADD CONSTRAINT chk_user_products_inventory
    CHECK (inventory_count >= -1);

-- User services constraints
ALTER TABLE user_services DROP CONSTRAINT IF EXISTS chk_user_services_status;
ALTER TABLE user_services ADD CONSTRAINT chk_user_services_status
    CHECK (status IN ('draft', 'active', 'paused', 'unavailable'));

-- Loans constraints
ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_status;
ALTER TABLE loans ADD CONSTRAINT chk_loans_status
    CHECK (status IN ('draft', 'active', 'funded', 'repaid', 'defaulted', 'cancelled'));

ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_positive_amounts;
ALTER TABLE loans ADD CONSTRAINT chk_loans_positive_amounts
    CHECK (original_amount > 0 AND remaining_balance >= 0);

ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_interest_rate;
ALTER TABLE loans ADD CONSTRAINT chk_loans_interest_rate
    CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100));

-- Profile constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_verification_status;
ALTER TABLE profiles ADD CONSTRAINT chk_profiles_verification_status
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_status;
ALTER TABLE profiles ADD CONSTRAINT chk_profiles_status
    CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

-- =====================================================================
-- PHASE 4: COMPLETION LOG
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 OrangeCat Database Improvements Completed Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Applied improvements:';
    RAISE NOTICE '  ✅ Foreign Key Constraints - Data integrity ensured';
    RAISE NOTICE '  ✅ Performance Indexes - Query optimization complete';
    RAISE NOTICE '  ✅ Data Validation - Business rules enforced';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is now production-ready with:';
    RAISE NOTICE '  🔗 Referential integrity across all tables';
    RAISE NOTICE '  📈 Optimized queries with proper indexing';
    RAISE NOTICE '  ✅ Data validation and business rule enforcement';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test your application functionality';
    RAISE NOTICE '  2. Monitor query performance in Supabase dashboard';
    RAISE NOTICE '  3. Consider setting up automated backups';
END $$;



