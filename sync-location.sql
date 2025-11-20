UPDATE profiles
SET location_search = location
WHERE location IS NOT NULL
  AND location <> ''
  AND (location_search IS NULL OR location_search = '');
