-- Add structured location fields to profiles table
-- This migration adds location_country, location_city, location_zip, location_search,
-- latitude, and longitude columns to support better local search functionality (like GoFundMe)

-- Add the new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_country TEXT,
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS location_zip TEXT,
  ADD COLUMN IF NOT EXISTS location_search TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_location_country ON public.profiles(location_country) WHERE location_country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location_city ON public.profiles(location_city) WHERE location_city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location_zip ON public.profiles(location_zip) WHERE location_zip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location_coords ON public.profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN public.profiles.location_country IS 'ISO 3166-1 alpha-2 country code (e.g., CH, US, DE)';
COMMENT ON COLUMN public.profiles.location_city IS 'City or municipality name';
COMMENT ON COLUMN public.profiles.location_zip IS 'ZIP or postal code';
COMMENT ON COLUMN public.profiles.location_search IS 'Formatted address for display and search';
COMMENT ON COLUMN public.profiles.latitude IS 'Geographic latitude coordinate';
COMMENT ON COLUMN public.profiles.longitude IS 'Geographic longitude coordinate';
