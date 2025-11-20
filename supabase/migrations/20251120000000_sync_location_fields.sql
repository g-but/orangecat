-- =====================================================================
-- SYNC LOCATION FIELDS - 2025-11-20
-- =====================================================================
-- This migration ensures consistency between legacy location field
-- and new location_search field to fix view/edit discrepancies
-- =====================================================================

-- =====================================================================
-- STEP 1: COPY LEGACY LOCATION TO LOCATION_SEARCH WHERE MISSING
-- =====================================================================
-- This ensures edit mode shows the same data as view mode

UPDATE profiles
SET
  location_search = location,
  updated_at = NOW()
WHERE
  location IS NOT NULL
  AND location != ''
  AND (location_search IS NULL OR location_search = '');

-- =====================================================================
-- STEP 2: ADD EMAIL FIELD IF MISSING
-- =====================================================================
-- Email should be tracked in profiles table for consistency

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email)
WHERE email IS NOT NULL;

-- =====================================================================
-- STEP 3: VERIFY LOCATION INDEXES EXIST
-- =====================================================================
-- These should already exist from previous migrations, but ensure they're present

CREATE INDEX IF NOT EXISTS idx_profiles_location_search
ON profiles(location_search)
WHERE location_search IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location_country
ON profiles(location_country)
WHERE location_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location_city
ON profiles(location_city)
WHERE location_city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location_coords
ON profiles(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =====================================================================
-- STEP 4: ADD HELPFUL COMMENT
-- =====================================================================

COMMENT ON COLUMN profiles.location_search IS 'Formatted address for display and search (synced from legacy location field)';
COMMENT ON COLUMN profiles.email IS 'User email address (synced from auth.users)';

-- =====================================================================
-- VERIFICATION QUERY
-- =====================================================================
-- Run this to verify the migration:
-- SELECT
--   COUNT(*) FILTER (WHERE location IS NOT NULL) as has_location,
--   COUNT(*) FILTER (WHERE location_search IS NOT NULL) as has_location_search,
--   COUNT(*) FILTER (WHERE location IS NOT NULL AND location_search IS NOT NULL) as both_set
-- FROM profiles;
