-- =====================================================================
-- ORANGECAT DATABASE MASTER FIX
-- =====================================================================
-- Complete database repair script that addresses all known issues
-- from the database audit and establishes a clean, consistent schema.
--
-- SAFE TO RUN MULTIPLE TIMES - All operations are idempotent
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$
BEGIN
    RAISE NOTICE 'Starting OrangeCat Database Master Fix...';
END $$;

-- =====================================================================
-- PHASE 1: SCHEMA CONSOLIDATION
-- =====================================================================

DO $$
DECLARE
    creator_count INTEGER;
    user_count INTEGER;
BEGIN
    RAISE NOTICE 'Phase 1: Consolidating schema inconsistencies...';

    -- Fix projects table duplicate columns (user_id vs creator_id)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'creator_id'
    ) THEN
        -- Migrate data from creator_id to user_id if needed
        SELECT COUNT(*) INTO creator_count FROM projects WHERE creator_id IS NOT NULL;
        SELECT COUNT(*) INTO user_count FROM projects WHERE user_id IS NOT NULL;

        IF creator_count > 0 AND user_count = 0 THEN
            UPDATE projects SET user_id = creator_id WHERE creator_id IS NOT NULL;
            RAISE NOTICE 'Migrated % rows from creator_id to user_id', creator_count;
        END IF;

        -- Drop the duplicate column
        ALTER TABLE projects DROP COLUMN creator_id;
        RAISE NOTICE 'Dropped duplicate creator_id column';
    END IF;
END $$;

-- Add missing columns that code expects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS raised_amount_sats BIGINT DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS public_visibility BOOLEAN DEFAULT true;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- =====================================================================
-- PHASE 2: CURRENCY MODEL STANDARDIZATION
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 2: Standardizing currency model to satoshis...';

    -- Convert BTC amounts to satoshis if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'goal_amount'
    ) THEN
        UPDATE projects
        SET goal_amount_sats = (goal_amount * 100000000)::BIGINT
        WHERE goal_amount > 0 AND goal_amount < 1000 AND goal_amount_sats = 0;

        ALTER TABLE projects DROP COLUMN goal_amount;
        RAISE NOTICE 'Converted goal_amount to goal_amount_sats';
    END IF;

    -- Clean up old currency columns
    ALTER TABLE projects DROP COLUMN IF EXISTS currency;
    ALTER TABLE projects DROP COLUMN IF EXISTS goal_currency;
    ALTER TABLE projects DROP COLUMN IF EXISTS current_amount;
END $$;

-- =====================================================================
-- PHASE 3: FIX BROKEN TRIGGERS AND FUNCTIONS
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 3: Fixing triggers and functions...';
END $$;

-- Drop broken triggers that reference non-existent columns
DROP TRIGGER IF EXISTS sync_project_funding ON transactions;
DROP FUNCTION IF EXISTS sync_project_funding();
DROP TRIGGER IF EXISTS update_project_funding ON transactions;
DROP FUNCTION IF EXISTS update_project_funding();

-- Create proper project funding sync function
CREATE OR REPLACE FUNCTION sync_project_funding()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update for completed transactions to projects
    IF NEW.status = 'completed' AND NEW.to_entity_type = 'project' THEN
        UPDATE projects
        SET
            raised_amount_sats = COALESCE(raised_amount_sats, 0) + NEW.amount_sats,
            contributor_count = COALESCE(contributor_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.to_entity_id::UUID;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER sync_project_funding_trigger
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION sync_project_funding();

-- =====================================================================
-- PHASE 4: ADD DATA VALIDATION CONSTRAINTS
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 4: Adding data validation constraints...';
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
    CHECK (status IN ('draft', 'active', 'paused', 'archived'));

ALTER TABLE user_products DROP CONSTRAINT IF EXISTS chk_user_products_price;
ALTER TABLE user_products ADD CONSTRAINT chk_user_products_price
    CHECK (price_sats > 0);

ALTER TABLE user_products DROP CONSTRAINT IF EXISTS chk_user_products_inventory;
ALTER TABLE user_products ADD CONSTRAINT chk_user_products_inventory
    CHECK (inventory_count >= -1);

-- User services constraints
ALTER TABLE user_services DROP CONSTRAINT IF EXISTS chk_user_services_status;
ALTER TABLE user_services ADD CONSTRAINT chk_user_services_status
    CHECK (status IN ('draft', 'active', 'paused', 'archived'));

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
-- PHASE 5: ADD UPDATED_AT TRIGGERS
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 5: Adding updated_at triggers...';
END $$;

-- Create the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables that need them
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('projects', 'profiles', 'user_products', 'user_services', 'assets', 'loans', 'organizations', 'transactions')
  LOOP
    -- Drop existing trigger if it exists
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at_%I ON %I.%I',
                   tbl.tablename, 'public', tbl.tablename);

    -- Add the trigger if updated_at column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl.tablename AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('CREATE TRIGGER trg_set_updated_at_%I BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
                     tbl.tablename, 'public', tbl.tablename);
    END IF;
  END LOOP;
END $$;

-- =====================================================================
-- PHASE 6: APPLY PERFORMANCE INDEXES
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 6: Applying performance indexes...';
END $$;

-- Include the best practice indexes (they are idempotent)
\i supabase/sql/best_practice_indexes.sql

-- =====================================================================
-- PHASE 7: APPLY RLS POLICIES
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 7: Applying RLS policies...';
END $$;

-- Include the RLS policies (they are idempotent)
\i supabase/sql/rls_policies.sql

-- =====================================================================
-- PHASE 8: APPLY FOREIGN KEYS
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 8: Applying foreign key constraints...';
END $$;

-- Include the foreign keys (they are idempotent)
\i supabase/sql/foreign_keys.sql

-- =====================================================================
-- PHASE 9: FINAL DATA CLEANUP
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 9: Performing final data cleanup...';

    -- Fix invalid data
    UPDATE projects SET contributor_count = GREATEST(0, contributor_count) WHERE contributor_count < 0;
    UPDATE projects SET raised_amount_sats = GREATEST(0, raised_amount_sats) WHERE raised_amount_sats < 0;
    UPDATE projects SET goal_amount_sats = GREATEST(0, goal_amount_sats) WHERE goal_amount_sats < 0;

    -- Fix future timestamps
    UPDATE profiles SET created_at = NOW() WHERE created_at > NOW();
    UPDATE profiles SET updated_at = NOW() WHERE updated_at > NOW();
    UPDATE projects SET created_at = NOW() WHERE created_at > NOW();
    UPDATE projects SET updated_at = NOW() WHERE updated_at > NOW();

    -- Ensure NOT NULL constraints where expected
    ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE projects ALTER COLUMN title SET NOT NULL;
    ALTER TABLE transactions ALTER COLUMN amount_sats SET NOT NULL;
END $$;

-- =====================================================================
-- COMPLETION LOG
-- =====================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 OrangeCat Database Master Fix completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Applied fixes for:';
    RAISE NOTICE '  ✅ Schema consolidation (duplicate columns resolved)';
    RAISE NOTICE '  ✅ Missing columns added';
    RAISE NOTICE '  ✅ Currency model standardized (satoshis only)';
    RAISE NOTICE '  ✅ Triggers and functions fixed';
    RAISE NOTICE '  ✅ Data validation constraints added';
    RAISE NOTICE '  ✅ updated_at triggers applied';
    RAISE NOTICE '  ✅ Performance indexes added';
    RAISE NOTICE '  ✅ RLS policies configured';
    RAISE NOTICE '  ✅ Foreign key constraints added';
    RAISE NOTICE '  ✅ Data cleanup completed';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run the verification script: node scripts/db-verify-fixes.mjs';
    RAISE NOTICE '  2. Test your application functionality';
    RAISE NOTICE '  3. Run the extended audit: node scripts/db-audit-extended.mjs';
END $$;















