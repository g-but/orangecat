#!/bin/bash
# Run location field sync migration

API_URL="https://api.supabase.com/v1/projects/ohkueislstxomdjavyhs/database/query"
TOKEN="sbp_7bc7546939c5675c6146d5773f83f05b0131c614"

echo "Starting location field migration..."

# Step 1: Sync legacy location to location_search
echo "Step 1: Syncing legacy location to location_search..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "UPDATE profiles SET location_search = location, updated_at = CURRENT_TIMESTAMP WHERE location IS NOT NULL AND location != '\'''\'' AND (location_search IS NULL OR location_search = '\'''\'');"}' | jq '.'

# Step 2: Add email column if missing
echo "Step 2: Adding email column..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;"}' | jq '.'

# Step 3: Create email index
echo "Step 3: Creating email index..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;"}' | jq '.'

# Step 4: Create location_search index
echo "Step 4: Creating location_search index..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE INDEX IF NOT EXISTS idx_profiles_location_search ON profiles(location_search) WHERE location_search IS NOT NULL;"}' | jq '.'

# Verification
echo "Verification: Checking location field sync..."
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) FILTER (WHERE location IS NOT NULL) as has_location, COUNT(*) FILTER (WHERE location_search IS NOT NULL) as has_location_search, COUNT(*) FILTER (WHERE location IS NOT NULL AND location_search IS NOT NULL) as both_set FROM profiles;"}' | jq '.'

echo "Migration complete!"
