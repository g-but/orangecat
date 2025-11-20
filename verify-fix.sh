#!/bin/bash

echo "========================================="
echo "Location Field Fix - Verification Script"
echo "========================================="
echo ""

API_URL="https://api.supabase.com/v1/projects/ohkueislstxomdjavyhs/database/query"
TOKEN="sbp_7bc7546939c5675c6146d5773f83f05b0131c614"

# Check 1: Verify columns exist
echo "✓ Check 1: Database columns"
echo "----------------------------"
./check-columns.sh | jq -r '.[] | select(.column_name | contains("location")) | "\(.column_name): \(.data_type)"'
echo ""

# Check 2: Data sync status
echo "✓ Check 2: Data sync status"
echo "----------------------------"
curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) FILTER (WHERE location IS NOT NULL) as has_location, COUNT(*) FILTER (WHERE location_search IS NOT NULL) as has_location_search FROM profiles;"}' | jq '.[] | "Legacy locations: \(.has_location) | New locations: \(.has_location_search)"'
echo ""

# Check 3: TypeScript compilation
echo "✓ Check 3: TypeScript compilation"
echo "-----------------------------------"
if npm run build --dry-run 2>&1 | grep -q "error"; then
  echo "❌ TypeScript errors found"
else
  echo "✅ No TypeScript errors"
fi
echo ""

# Check 4: Check for demo data usage
echo "✓ Check 4: Demo data audit"
echo "---------------------------"
DEMO_COUNT=$(grep -r "from '@/data/demo'" src/app src/components --include="*.tsx" 2>/dev/null | wc -l)
if [ "$DEMO_COUNT" -eq 0 ]; then
  echo "✅ No demo data imports in app/components"
else
  echo "⚠️  Found $DEMO_COUNT demo data imports"
fi
echo ""

# Check 5: Navigation fix
echo "✓ Check 5: Navigation configuration"
echo "------------------------------------"
if grep -q "?tab=info" src/components/ui/UserProfileDropdown.tsx; then
  echo "✅ UserProfileDropdown navigates to Info tab"
else
  echo "❌ UserProfileDropdown missing tab parameter"
fi

if grep -q "?tab=info" src/components/dashboard/DashboardLayout.tsx; then
  echo "✅ DashboardLayout navigates to Info tab"
else
  echo "❌ DashboardLayout missing tab parameter"
fi
echo ""

# Check 6: Fallback logic
echo "✓ Check 6: Edit mode fallback"
echo "-------------------------------"
if grep -q "profile.location_search || profile.location" src/components/profile/ModernProfileEditor.tsx; then
  echo "✅ Edit mode has fallback to legacy location"
else
  echo "❌ Edit mode missing fallback"
fi
echo ""

echo "========================================="
echo "Verification Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review TEST_LOCATION_FIX.md for manual testing"
echo "2. Run npm run build to verify TypeScript compilation"
echo "3. Test the app in development mode"
echo "4. Deploy and verify in production"
