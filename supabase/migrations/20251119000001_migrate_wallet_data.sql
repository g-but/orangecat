-- Migration: Migrate Existing Wallet Data to New Architecture
-- Priority: P0 - CRITICAL
-- Created: 2025-11-19
-- Purpose: Migrate data from old wallets table to new wallet_definitions, wallet_ownerships, wallet_categories
-- Prerequisites: 20251119000000_fix_wallet_architecture.sql must be run first

-- ============================================================================
-- DATA MIGRATION SCRIPT
-- ============================================================================

BEGIN;

-- Step 1: Migrate wallet definitions (deduplicate by address_or_xpub)
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
  updated_at
)
SELECT DISTINCT ON (address_or_xpub)
  gen_random_uuid(),
  address_or_xpub,
  wallet_type,
  label,
  description,
  balance_btc,
  balance_updated_at,
  user_id,
  created_at,
  updated_at
FROM public.wallets
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallet_definitions wd
  WHERE wd.address_or_xpub = wallets.address_or_xpub
)
ORDER BY address_or_xpub, created_at;

-- Step 2: Create ownership records for profiles
INSERT INTO public.wallet_ownerships (
  wallet_id,
  owner_type,
  owner_id,
  permission_level,
  added_by,
  added_at
)
SELECT
  wd.id,
  'profile',
  w.profile_id,
  'manage',
  w.user_id,
  w.created_at
FROM public.wallets w
JOIN public.wallet_definitions wd ON wd.address_or_xpub = w.address_or_xpub
WHERE w.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.wallet_ownerships wo
    WHERE wo.wallet_id = wd.id
      AND wo.owner_type = 'profile'
      AND wo.owner_id = w.profile_id
  );

-- Step 3: Create ownership records for projects
INSERT INTO public.wallet_ownerships (
  wallet_id,
  owner_type,
  owner_id,
  permission_level,
  added_by,
  added_at
)
SELECT
  wd.id,
  'project',
  w.project_id,
  'manage',
  w.user_id,
  w.created_at
FROM public.wallets w
JOIN public.wallet_definitions wd ON wd.address_or_xpub = w.address_or_xpub
WHERE w.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.wallet_ownerships wo
    WHERE wo.wallet_id = wd.id
      AND wo.owner_type = 'project'
      AND wo.owner_id = w.project_id
  );

-- Step 4: Create category records
INSERT INTO public.wallet_categories (
  wallet_id,
  entity_type,
  entity_id,
  category,
  category_icon,
  goal_amount,
  goal_currency,
  goal_deadline,
  is_active,
  display_order,
  is_primary,
  created_at,
  updated_at
)
SELECT
  wd.id,
  CASE
    WHEN w.profile_id IS NOT NULL THEN 'profile'
    WHEN w.project_id IS NOT NULL THEN 'project'
  END,
  COALESCE(w.profile_id, w.project_id),
  w.category,
  w.category_icon,
  w.goal_amount,
  w.goal_currency,
  w.goal_deadline,
  w.is_active,
  w.display_order,
  w.is_primary,
  w.created_at,
  w.updated_at
FROM public.wallets w
JOIN public.wallet_definitions wd ON wd.address_or_xpub = w.address_or_xpub
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallet_categories wc
  WHERE wc.wallet_id = wd.id
    AND wc.entity_type = CASE
      WHEN w.profile_id IS NOT NULL THEN 'profile'
      WHEN w.project_id IS NOT NULL THEN 'project'
    END
    AND wc.entity_id = COALESCE(w.profile_id, w.project_id)
    AND wc.category = w.category
);

-- Step 5: Verify migration counts
DO $$
DECLARE
  old_wallet_count INT;
  new_definition_count INT;
  new_ownership_count INT;
  new_category_count INT;
BEGIN
  -- Count old records
  SELECT COUNT(*) INTO old_wallet_count FROM public.wallets;

  -- Count new records
  SELECT COUNT(*) INTO new_definition_count FROM public.wallet_definitions;
  SELECT COUNT(*) INTO new_ownership_count FROM public.wallet_ownerships;
  SELECT COUNT(*) INTO new_category_count FROM public.wallet_categories;

  RAISE NOTICE '📊 MIGRATION SUMMARY:';
  RAISE NOTICE '  Old wallets table: % records', old_wallet_count;
  RAISE NOTICE '  New wallet_definitions: % records', new_definition_count;
  RAISE NOTICE '  New wallet_ownerships: % records', new_ownership_count;
  RAISE NOTICE '  New wallet_categories: % records', new_category_count;
  RAISE NOTICE '';

  IF new_category_count >= old_wallet_count THEN
    RAISE NOTICE '✅ Migration appears successful (categories >= old wallets)';
  ELSE
    RAISE WARNING '⚠️  Migration may be incomplete (categories < old wallets)';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Test: Get wallets for a specific profile
-- SELECT * FROM get_entity_wallets('profile', 'YOUR_PROFILE_ID');

-- Test: Get wallets for a specific project
-- SELECT * FROM get_entity_wallets('project', 'YOUR_PROJECT_ID');

-- Test: Find wallets shared between entities
-- SELECT
--   wd.address_or_xpub,
--   wd.label,
--   array_agg(wo.owner_type || ':' || wo.owner_id) as owners
-- FROM wallet_definitions wd
-- JOIN wallet_ownerships wo ON wo.wallet_id = wd.id
-- GROUP BY wd.id, wd.address_or_xpub, wd.label
-- HAVING COUNT(DISTINCT wo.owner_id) > 1;

-- Test: Find wallets with multiple categories
-- SELECT
--   wd.address_or_xpub,
--   wd.label,
--   wc.entity_type,
--   wc.entity_id,
--   array_agg(wc.category) as categories
-- FROM wallet_definitions wd
-- JOIN wallet_categories wc ON wc.wallet_id = wd.id
-- GROUP BY wd.id, wd.address_or_xpub, wd.label, wc.entity_type, wc.entity_id
-- HAVING COUNT(wc.id) > 1;
