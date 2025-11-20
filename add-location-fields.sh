#!/bin/bash

API_URL="https://api.supabase.com/v1/projects/ohkueislstxomdjavyhs/database/query"
TOKEN="sbp_7bc7546939c5675c6146d5773f83f05b0131c614"

echo "Adding location fields to profiles table..."

# Add location_search
echo "Adding location_search..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_search TEXT;"}' | jq '.'

# Add location_country
echo "Adding location_country..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_country TEXT;"}' | jq '.'

# Add location_city
echo "Adding location_city..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_city TEXT;"}' | jq '.'

# Add location_zip
echo "Adding location_zip..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_zip TEXT;"}' | jq '.'

# Add latitude
echo "Adding latitude..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;"}' | jq '.'

# Add longitude
echo "Adding longitude..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"}' | jq '.'

# Sync legacy location to location_search
echo "Syncing legacy location data..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "UPDATE profiles SET location_search = location WHERE location IS NOT NULL AND location != '\'''\'' AND (location_search IS NULL OR location_search = '\'\'\'');"}' | jq '.'

# Create indexes
echo "Creating indexes..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE INDEX IF NOT EXISTS idx_profiles_location_search ON profiles(location_search) WHERE location_search IS NOT NULL;"}' | jq '.'

curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE INDEX IF NOT EXISTS idx_profiles_location_country ON profiles(location_country) WHERE location_country IS NOT NULL;"}' | jq '.'

curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE INDEX IF NOT EXISTS idx_profiles_location_city ON profiles(location_city) WHERE location_city IS NOT NULL;"}' | jq '.'

curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE INDEX IF NOT EXISTS idx_profiles_location_coords ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;"}' | jq '.'

echo "Done! Verifying..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) FILTER (WHERE location IS NOT NULL) as has_location, COUNT(*) FILTER (WHERE location_search IS NOT NULL) as has_location_search FROM profiles;"}' | jq '.'
