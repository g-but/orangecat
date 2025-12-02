-- ============================================================================
-- Wallet Migration: Verify and Migrate from Metadata to Table
-- Description: Final migration of wallet data from profiles.metadata to wallets table
-- Author: Architecture Team
-- Date: 2025-02-01
-- ============================================================================

-- This migration:
-- 1. Verifies wallets table exists
-- 2. Counts existing metadata wallets
-- 3. Migrates any remaining wallets from metadata to table
-- 4. Preserves existing wallets (no duplicates)
-- 5. Optionally cleans up metadata after verification

BEGIN;

-- ============================================================================
-- STEP 1: Verify wallets table exists
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'wallets'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Wallets table does not exist! Run wallet creation migration first.';
  END IF;

  RAISE NOTICE 'Wallets table exists ✓';
END $$;

-- ============================================================================
-- STEP 2: Count existing metadata wallets
-- ============================================================================

DO $$
DECLARE
  metadata_wallet_count INTEGER;
  total_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO metadata_wallet_count
  FROM profiles
  WHERE metadata ? 'wallets'
    AND jsonb_typeof(metadata->'wallets') = 'array'
    AND jsonb_array_length(metadata->'wallets') > 0;

  SELECT COUNT(*) INTO total_profiles FROM profiles;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Status:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Profiles with wallet metadata: %', metadata_wallet_count;

  IF metadata_wallet_count = 0 THEN
    RAISE NOTICE 'No wallet metadata found - migration may already be complete!';
  ELSE
    RAISE NOTICE 'Will attempt to migrate % profile(s)', metadata_wallet_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Migrate wallets from metadata to table
-- ============================================================================

INSERT INTO wallets (
  profile_id,
  user_id,
  address_or_xpub,
  wallet_type,
  label,
  description,
  category,
  category_icon,
  is_primary,
  is_active,
  display_order,
  created_at,
  updated_at
)
SELECT DISTINCT ON (p.id, w->>'address')
  -- IDs
  p.id as profile_id,
  p.id as user_id,

  -- Wallet address
  TRIM(w->>'address') as address_or_xpub,

  -- Wallet type (detect xpub vs address)
  CASE
    WHEN TRIM(w->>'address') ~ '^(xpub|ypub|zpub|tpub)'
    THEN 'xpub'
    ELSE 'address'
  END as wallet_type,

  -- Label and description
  COALESCE(NULLIF(TRIM(w->>'label'), ''), 'Imported Wallet') as label,
  NULLIF(TRIM(w->>'description'), '') as description,

  -- Category
  COALESCE(
    NULLIF(TRIM(w->>'category'), ''),
    'general'
  ) as category,

  -- Category icon (default based on category)
  CASE COALESCE(NULLIF(TRIM(w->>'category'), ''), 'general')
    WHEN 'rent' THEN '🏠'
    WHEN 'food' THEN '🍔'
    WHEN 'medical' THEN '💊'
    WHEN 'education' THEN '🎓'
    WHEN 'emergency' THEN '🚨'
    WHEN 'transportation' THEN '🚗'
    WHEN 'utilities' THEN '💡'
    WHEN 'projects' THEN '🚀'
    WHEN 'legal' THEN '⚖️'
    WHEN 'entertainment' THEN '🎭'
    ELSE '💰'
  END as category_icon,

  -- Flags
  COALESCE((w->>'is_primary')::boolean, false) as is_primary,
  COALESCE((w->>'is_active')::boolean, true) as is_active,

  -- Display order
  COALESCE((w->>'display_order')::integer, 0) as display_order,

  -- Timestamps
  NOW() as created_at,
  NOW() as updated_at

FROM
  profiles p,
  LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(p.metadata->'wallets') = 'array'
      THEN p.metadata->'wallets'
      ELSE '[]'::jsonb
    END
  ) w

WHERE
  -- Only migrate profiles that have wallet metadata
  p.metadata ? 'wallets'
  AND jsonb_typeof(p.metadata->'wallets') = 'array'

  -- Must have a valid address
  AND w->>'address' IS NOT NULL
  AND TRIM(w->>'address') != ''
  AND LENGTH(TRIM(w->>'address')) >= 26  -- Minimum Bitcoin address length

  -- Don't migrate if this exact wallet already exists
  AND NOT EXISTS (
    SELECT 1 FROM wallets
    WHERE profile_id = p.id
    AND address_or_xpub = TRIM(w->>'address')
  );

-- ============================================================================
-- STEP 4: Verify migration results
-- ============================================================================

DO $$
DECLARE
  migrated_count INTEGER;
  total_wallet_count INTEGER;
BEGIN
  -- Count wallets created in last minute (just migrated)
  SELECT COUNT(*) INTO migrated_count
  FROM wallets
  WHERE created_at > NOW() - INTERVAL '1 minute';

  -- Count total wallets
  SELECT COUNT(*) INTO total_wallet_count
  FROM wallets;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Results:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Wallets migrated this run: %', migrated_count;
  RAISE NOTICE 'Total wallets in table: %', total_wallet_count;

  IF migrated_count > 0 THEN
    RAISE NOTICE 'Successfully migrated % wallet(s) ✓', migrated_count;
  ELSE
    RAISE NOTICE 'No new wallets migrated (already complete) ✓';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Update is_primary flag if needed
-- ============================================================================

-- Ensure each profile has at most one primary wallet
-- If multiple primaries exist, keep the first one
UPDATE wallets w1
SET is_primary = false
WHERE is_primary = true
  AND EXISTS (
    SELECT 1 FROM wallets w2
    WHERE w2.profile_id = w1.profile_id
    AND w2.is_primary = true
    AND w2.created_at < w1.created_at
  );

-- Ensure each profile has at least one primary wallet
-- If none exist, mark the oldest as primary
UPDATE wallets w1
SET is_primary = true
WHERE profile_id IN (
  SELECT profile_id
  FROM wallets
  WHERE is_active = true
  GROUP BY profile_id
  HAVING COUNT(*) FILTER (WHERE is_primary = true) = 0
)
AND w1.id = (
  SELECT id
  FROM wallets w2
  WHERE w2.profile_id = w1.profile_id
    AND w2.is_active = true
  ORDER BY w2.created_at ASC
  LIMIT 1
);

-- ============================================================================
-- STEP 6: Clean up metadata (COMMENTED OUT FOR SAFETY)
-- ============================================================================

-- IMPORTANT: Only uncomment after verifying migration succeeded!
-- This permanently removes wallet data from metadata

/*
UPDATE profiles
SET metadata = metadata - 'wallets'
WHERE metadata ? 'wallets';

RAISE NOTICE 'Cleaned up wallet metadata from profiles ✓';
*/

RAISE NOTICE '========================================';
RAISE NOTICE 'IMPORTANT: Metadata cleanup is DISABLED';
RAISE NOTICE 'To enable: Uncomment STEP 6 after verifying migration';
RAISE NOTICE '========================================';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration)
-- ============================================================================

-- Check remaining metadata wallets (should decrease to 0 after cleanup)
SELECT
  COUNT(*) as profiles_with_metadata,
  SUM(jsonb_array_length(metadata->'wallets')) as total_metadata_wallets
FROM profiles
WHERE metadata ? 'wallets'
  AND jsonb_typeof(metadata->'wallets') = 'array';

-- Check wallets table status
SELECT
  COUNT(*) as total_wallets,
  COUNT(*) FILTER (WHERE profile_id IS NOT NULL) as profile_wallets,
  COUNT(*) FILTER (WHERE project_id IS NOT NULL) as project_wallets,
  COUNT(*) FILTER (WHERE is_primary = true) as primary_wallets,
  COUNT(*) FILTER (WHERE is_active = true) as active_wallets
FROM wallets;

-- Check for profiles without wallets
SELECT COUNT(*) as profiles_without_wallets
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM wallets WHERE profile_id = p.id AND is_active = true
);
