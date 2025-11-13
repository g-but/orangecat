-- =====================================================================
-- ENHANCE PROFILE LOCATION FIELDS - November 2025
-- =====================================================================
-- This migration adds structured location fields to the profiles table
-- to support better local search functionality (like GoFundMe)
-- =====================================================================

-- =====================================================================
-- STEP 1: ADD NEW LOCATION FIELDS
-- =====================================================================

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS location_zip TEXT;

-- =====================================================================
-- STEP 2: MIGRATE EXISTING DATA
-- =====================================================================
-- If there's existing location data, try to parse it into the new fields
-- This is a best-effort migration - manual review may be needed

DO $$
DECLARE
  profile_record RECORD;
  location_parts TEXT[];
BEGIN
  -- Loop through profiles with existing location data
  FOR profile_record IN
    SELECT id, location
    FROM public.profiles
    WHERE location IS NOT NULL
    AND location != ''
    AND (location_country IS NULL OR location_city IS NULL)
  LOOP
    -- Simple parsing: assume format is "City, Country" or "City, State, Country"
    -- Split by comma and clean up whitespace
    location_parts := string_to_array(trim(profile_record.location), ',');

    -- Update based on number of parts
    IF array_length(location_parts, 1) >= 2 THEN
      -- Assume last part is country, second to last is city/state
      UPDATE public.profiles
      SET
        location_country = trim(location_parts[array_length(location_parts, 1)]),
        location_city = trim(location_parts[array_length(location_parts, 1) - 1])
      WHERE id = profile_record.id;
    ELSIF array_length(location_parts, 1) = 1 THEN
      -- Only one part - could be city or country, default to city
      UPDATE public.profiles
      SET location_city = trim(location_parts[1])
      WHERE id = profile_record.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Migrated location data for profiles table';
END $$;

-- =====================================================================
-- STEP 3: ADD INDEXES FOR SEARCH PERFORMANCE
-- =====================================================================

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_country ON public.profiles(location_country) WHERE location_country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location_city ON public.profiles(location_city) WHERE location_city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location_zip ON public.profiles(location_zip) WHERE location_zip IS NOT NULL;

-- Composite index for common location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_combined ON public.profiles(location_country, location_city) WHERE location_country IS NOT NULL OR location_city IS NOT NULL;

-- =====================================================================
-- STEP 4: ADD VALIDATION CONSTRAINTS
-- =====================================================================

-- Country code validation (ISO 3166-1 alpha-2 codes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_location_country_format'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_location_country_format
    CHECK (location_country IS NULL OR length(location_country) = 2);
  END IF;
END $$;

-- City name validation (reasonable length)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_location_city_length'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_location_city_length
    CHECK (location_city IS NULL OR length(location_city) <= 100);
  END IF;
END $$;

-- ZIP/Postal code validation (flexible format)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_location_zip_length'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_location_zip_length
    CHECK (location_zip IS NULL OR length(location_zip) <= 20);
  END IF;
END $$;

-- =====================================================================
-- STEP 5: ADD HELPFUL COMMENTS
-- =====================================================================

COMMENT ON COLUMN public.profiles.location_country IS 'ISO 3166-1 alpha-2 country code (e.g., CH, US, DE)';
COMMENT ON COLUMN public.profiles.location_city IS 'City or municipality name';
COMMENT ON COLUMN public.profiles.location_zip IS 'ZIP or postal code';

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- Summary of changes:
-- ✅ Added location_country, location_city, location_zip columns
-- ✅ Migrated existing location data (best effort)
-- ✅ Added performance indexes for location queries
-- ✅ Added validation constraints
-- ✅ Added helpful column comments

-- To verify the migration:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' AND column_name LIKE 'location%' ORDER BY column_name;
-- SELECT COUNT(*) as migrated_profiles FROM profiles WHERE location_country IS NOT NULL OR location_city IS NOT NULL OR location_zip IS NOT NULL;
