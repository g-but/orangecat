-- =====================================================
-- Migration: Migrate Wallet Data (v2 - WITH FIXES)
-- =====================================================
-- Created: 2025-11-19
-- Purpose: Migrate data from old wallets table to new architecture
-- Fixes: Intelligent deduplication that preserves all meaningful data
--
-- CRITICAL FIXES IN V2:
-- ✅ Uses intelligent aggregation instead of arbitrary DISTINCT ON
-- ✅ Preserves non-null labels, descriptions
-- ✅ Uses highest balance and most recent update
-- ✅ Better error handling and verification
--
-- Dependencies: Requires 20251119100000_fix_wallet_architecture_v2.sql
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFY OLD TABLE EXISTS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wallets'
  ) THEN
    RAISE NOTICE 'Old wallets table does not exist - skipping migration';
    RETURN;
  END IF;
END $$;

-- =====================================================
-- 2. MIGRATE TO WALLET_DEFINITIONS
-- =====================================================
-- Use intelligent deduplication: preserve best data from duplicates

INSERT INTO public.wallet_definitions (
  id,
  address_or_xpub,
  wallet_type,
  label,
  description,
  balance_btc,
  balance_updated_at,
  created_by,
  created_at,
  updated_at,
  is_deleted,
  deleted_at
)
SELECT
  gen_random_uuid() as id,
  w.address_or_xpub,
  w.wallet_type,

  -- Intelligent label selection: prefer non-null, non-empty, most descriptive
  COALESCE(
    -- Try to find the most descriptive non-default label
    NULLIF(
      (SELECT label FROM public.wallets w2
       WHERE w2.address_or_xpub = w.address_or_xpub
         AND label IS NOT NULL
         AND label != ''
         AND label NOT LIKE 'Wallet%' -- Avoid generic labels
         AND label NOT LIKE 'Bitcoin%'
       ORDER BY length(label) DESC
       LIMIT 1),
      ''
    ),
    -- Fall back to any non-null label
    NULLIF(
      (SELECT label FROM public.wallets w2
       WHERE w2.address_or_xpub = w.address_or_xpub
         AND label IS NOT NULL
         AND label != ''
       ORDER BY created_at
       LIMIT 1),
      ''
    ),
    -- Final fallback
    'Imported Wallet'
  ) as label,

  -- Intelligent description selection: prefer longest non-null description
  COALESCE(
    NULLIF(
      (SELECT description FROM public.wallets w2
       WHERE w2.address_or_xpub = w.address_or_xpub
         AND description IS NOT NULL
         AND description != ''
       ORDER BY length(description) DESC
       LIMIT 1),
      ''
    ),
    NULL
  ) as description,

  -- Use highest balance (most up-to-date)
  (SELECT balance_btc FROM public.wallets w2
   WHERE w2.address_or_xpub = w.address_or_xpub
   ORDER BY balance_btc DESC NULLS LAST, updated_at DESC NULLS LAST
   LIMIT 1) as balance_btc,

  -- Most recent balance update
  (SELECT balance_updated_at FROM public.wallets w2
   WHERE w2.address_or_xpub = w.address_or_xpub
   ORDER BY balance_updated_at DESC NULLS LAST
   LIMIT 1) as balance_updated_at,

  -- First creator (for audit trail)
  (SELECT user_id FROM public.wallets w2
   WHERE w2.address_or_xpub = w.address_or_xpub
   ORDER BY created_at
   LIMIT 1) as created_by,

  -- Earliest creation date
  MIN(w.created_at) as created_at,

  -- Most recent update
  MAX(w.updated_at) as updated_at,

  -- Soft delete: wallet is deleted if ALL copies were deleted
  bool_and(COALESCE(w.is_deleted, false)) as is_deleted,

  -- Most recent deletion timestamp
  MAX(w.deleted_at) as deleted_at

FROM public.wallets w
GROUP BY w.address_or_xpub, w.wallet_type
ORDER BY MIN(w.created_at);

-- =====================================================
-- 3. MIGRATE TO WALLET_OWNERSHIPS
-- =====================================================
-- Create ownership records for profiles and projects

-- Profile ownerships
INSERT INTO public.wallet_ownerships (
  id,
  wallet_id,
  owner_type,
  owner_id,
  permission_level,
  is_active,
  added_by,
  added_at
)
SELECT DISTINCT
  gen_random_uuid(),
  wd.id,
  'profile'::TEXT,
  w.profile_id,
  'manage'::TEXT, -- Give manage permission (can edit categories)
  NOT COALESCE(w.is_deleted, false), -- Active if not deleted
  w.user_id,
  w.created_at
FROM public.wallets w
INNER JOIN public.wallet_definitions wd
  ON wd.address_or_xpub = w.address_or_xpub
WHERE w.profile_id IS NOT NULL
ON CONFLICT (wallet_id, owner_type, owner_id) DO NOTHING;

-- Project ownerships
INSERT INTO public.wallet_ownerships (
  id,
  wallet_id,
  owner_type,
  owner_id,
  permission_level,
  is_active,
  added_by,
  added_at
)
SELECT DISTINCT
  gen_random_uuid(),
  wd.id,
  'project'::TEXT,
  w.project_id,
  'manage'::TEXT,
  NOT COALESCE(w.is_deleted, false),
  w.user_id,
  w.created_at
FROM public.wallets w
INNER JOIN public.wallet_definitions wd
  ON wd.address_or_xpub = w.address_or_xpub
WHERE w.project_id IS NOT NULL
ON CONFLICT (wallet_id, owner_type, owner_id) DO NOTHING;

-- =====================================================
-- 4. MIGRATE TO WALLET_CATEGORIES
-- =====================================================
-- Create category records (if old table had category field)

DO $$
BEGIN
  -- Check if category column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallets'
      AND column_name = 'category'
  ) THEN
    -- Profile categories
    INSERT INTO public.wallet_categories (
      id,
      wallet_id,
      entity_type,
      entity_id,
      category,
      goal_amount,
      is_active,
      added_by,
      added_at
    )
    SELECT DISTINCT
      gen_random_uuid(),
      wd.id,
      'profile'::TEXT,
      w.profile_id,
      COALESCE(w.category, 'general')::TEXT,
      w.goal_amount,
      NOT COALESCE(w.is_deleted, false),
      w.user_id,
      w.created_at
    FROM public.wallets w
    INNER JOIN public.wallet_definitions wd
      ON wd.address_or_xpub = w.address_or_xpub
    WHERE w.profile_id IS NOT NULL
      AND w.category IS NOT NULL
    ON CONFLICT (wallet_id, entity_type, entity_id, category) DO NOTHING;

    -- Project categories
    INSERT INTO public.wallet_categories (
      id,
      wallet_id,
      entity_type,
      entity_id,
      category,
      goal_amount,
      is_active,
      added_by,
      added_at
    )
    SELECT DISTINCT
      gen_random_uuid(),
      wd.id,
      'project'::TEXT,
      w.project_id,
      COALESCE(w.category, 'general')::TEXT,
      w.goal_amount,
      NOT COALESCE(w.is_deleted, false),
      w.user_id,
      w.created_at
    FROM public.wallets w
    INNER JOIN public.wallet_definitions wd
      ON wd.address_or_xpub = w.address_or_xpub
    WHERE w.project_id IS NOT NULL
      AND w.category IS NOT NULL
    ON CONFLICT (wallet_id, entity_type, entity_id, category) DO NOTHING;
  ELSE
    RAISE NOTICE 'Old wallets table has no category column - skipping category migration';
  END IF;
END $$;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify migration success

DO $$
DECLARE
  v_old_count INT;
  v_old_unique_addresses INT;
  v_new_definitions INT;
  v_new_ownerships INT;
  v_new_categories INT;
  v_orphaned_ownerships INT;
  v_orphaned_categories INT;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO v_old_count FROM public.wallets;
  SELECT COUNT(DISTINCT address_or_xpub) INTO v_old_unique_addresses FROM public.wallets;
  SELECT COUNT(*) INTO v_new_definitions FROM public.wallet_definitions;
  SELECT COUNT(*) INTO v_new_ownerships FROM public.wallet_ownerships;
  SELECT COUNT(*) INTO v_new_categories FROM public.wallet_categories;

  -- Check for orphaned records (should be 0)
  SELECT COUNT(*) INTO v_orphaned_ownerships
  FROM public.wallet_ownerships wo
  WHERE wo.owner_type = 'profile' AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = wo.owner_id
  ) OR wo.owner_type = 'project' AND NOT EXISTS (
    SELECT 1 FROM public.projects pr WHERE pr.id = wo.owner_id
  );

  SELECT COUNT(*) INTO v_orphaned_categories
  FROM public.wallet_categories wc
  WHERE wc.entity_type = 'profile' AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = wc.entity_id
  ) OR wc.entity_type = 'project' AND NOT EXISTS (
    SELECT 1 FROM public.projects pr WHERE pr.id = wc.entity_id
  );

  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WALLET MIGRATION VERIFICATION REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Old wallets count: %', v_old_count;
  RAISE NOTICE 'Old unique addresses: %', v_old_unique_addresses;
  RAISE NOTICE 'New wallet definitions: %', v_new_definitions;
  RAISE NOTICE 'New wallet ownerships: %', v_new_ownerships;
  RAISE NOTICE 'New wallet categories: %', v_new_categories;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Orphaned ownerships: % (should be 0)', v_orphaned_ownerships;
  RAISE NOTICE 'Orphaned categories: % (should be 0)', v_orphaned_categories;
  RAISE NOTICE '========================================';

  -- Validation checks
  IF v_new_definitions != v_old_unique_addresses THEN
    RAISE WARNING 'Definition count mismatch! Expected: %, Got: %',
      v_old_unique_addresses, v_new_definitions;
  END IF;

  IF v_orphaned_ownerships > 0 THEN
    RAISE WARNING 'Found % orphaned ownership records - referential integrity issue!',
      v_orphaned_ownerships;
  END IF;

  IF v_orphaned_categories > 0 THEN
    RAISE WARNING 'Found % orphaned category records - referential integrity issue!',
      v_orphaned_categories;
  END IF;

  IF v_new_definitions = v_old_unique_addresses
     AND v_orphaned_ownerships = 0
     AND v_orphaned_categories = 0 THEN
    RAISE NOTICE '✅ Migration successful! All checks passed.';
  ELSE
    RAISE WARNING '⚠️ Migration completed with warnings. Review above.';
  END IF;
END $$;

-- =====================================================
-- 6. SAMPLE QUERIES TO VERIFY DATA
-- =====================================================

-- View sample wallet definitions
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SAMPLE WALLET DEFINITIONS (first 5)';
  RAISE NOTICE '========================================';

  FOR r IN (
    SELECT
      left(id::TEXT, 8) || '...' as id,
      left(address_or_xpub, 15) || '...' as address,
      label,
      balance_btc,
      is_deleted
    FROM public.wallet_definitions
    ORDER BY created_at
    LIMIT 5
  ) LOOP
    RAISE NOTICE 'ID: % | Address: % | Label: % | Balance: % | Deleted: %',
      r.id, r.address, r.label, r.balance_btc, r.is_deleted;
  END LOOP;
END $$;

-- View sample ownerships
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SAMPLE WALLET OWNERSHIPS (first 5)';
  RAISE NOTICE '========================================';

  FOR r IN (
    SELECT
      left(wo.wallet_id::TEXT, 8) || '...' as wallet_id,
      wo.owner_type,
      left(wo.owner_id::TEXT, 8) || '...' as owner_id,
      wo.permission_level,
      wo.is_active
    FROM public.wallet_ownerships wo
    ORDER BY wo.added_at
    LIMIT 5
  ) LOOP
    RAISE NOTICE 'Wallet: % | Type: % | Owner: % | Permission: % | Active: %',
      r.wallet_id, r.owner_type, r.owner_id, r.permission_level, r.is_active;
  END LOOP;
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
--
-- ✅ What was migrated:
--   - All unique wallet addresses → wallet_definitions
--   - All profile/project associations → wallet_ownerships
--   - All categories (if they existed) → wallet_categories
--
-- ✅ How duplicates were handled:
--   - Labels: Kept most descriptive non-generic label
--   - Descriptions: Kept longest description
--   - Balance: Kept highest balance with most recent update
--   - Timestamps: Kept earliest created_at, latest updated_at
--   - Deleted: Only marked deleted if ALL copies were deleted
--
-- ✅ Data integrity:
--   - Validation triggers ensure no orphaned records
--   - Cleanup triggers handle cascade deletes
--   - RLS policies protect data access
--
-- ⚠️ Next steps:
--   1. Verify migration results (check NOTICE messages above)
--   2. Test with application code
--   3. Keep old 'wallets' table as backup for now
--   4. Drop old table after thorough testing (NOT AUTOMATIC)
--
-- =====================================================
