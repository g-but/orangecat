# Location Field Fix - Test Plan

## What Was Fixed

### 1. Type Definitions (`src/types/database.ts`)

- ✅ Added all location fields to Profile type:
  - `location_search` (formatted address for display)
  - `location_country` (ISO 3166-1 alpha-2 code)
  - `location_city` (city name)
  - `location_zip` (postal code)
  - `latitude` (coordinates)
  - `longitude` (coordinates)
  - `email` (user email)

### 2. Database Migration

- ✅ Added location columns to profiles table
- ✅ Synced legacy `location` data to `location_search`
- ✅ Created indexes for performance

### 3. Edit Mode Fallback

- ✅ Updated `ModernProfileEditor.tsx` to fallback to legacy `location` field
- ✅ Ensures view mode and edit mode show same data

### 4. Navigation

- ✅ "Edit Profile" buttons now navigate to Info tab (`?tab=info`)
- ✅ ProfileViewTabs reads URL parameter and shows correct tab

## Test Cases

### Test 1: View/Edit Consistency

**Expected:** Location shown in view mode appears in edit mode

1. Go to your profile: `/profiles/[your-username]`
2. Click "Info" tab
3. Note the location displayed (e.g., "Zurich, Switzerland")
4. Click "Edit Profile" button
5. ✅ **PASS IF:** Location field shows the same value

### Test 2: Edit Profile Navigation

**Expected:** Edit Profile button opens Info tab

1. Click user menu (top right)
2. Click "Edit Profile"
3. ✅ **PASS IF:** Profile page opens with Info tab active (not Overview)

### Test 3: Location Autocomplete

**Expected:** Can search and select location

1. Navigate to Info tab → Edit
2. Click location field
3. Type "New York"
4. Select "New York, NY, USA" from dropdown
5. Click Save
6. ✅ **PASS IF:** Location saves and displays correctly

### Test 4: Data Persistence

**Expected:** Location persists across sessions

1. Edit location to "Berlin, Germany"
2. Save
3. Refresh page
4. ✅ **PASS IF:** Location still shows "Berlin, Germany"

### Test 5: Empty Location Handling

**Expected:** No errors with empty location

1. Edit profile
2. Clear location field completely
3. Save
4. ✅ **PASS IF:** Saves without error, location shows blank

## Database Verification

Run this query to verify data sync:

```sql
SELECT
  COUNT(*) FILTER (WHERE location IS NOT NULL) as has_location,
  COUNT(*) FILTER (WHERE location_search IS NOT NULL) as has_location_search,
  COUNT(*) FILTER (WHERE location IS NOT NULL AND location_search IS NOT NULL) as both_synced
FROM profiles;
```

Expected output:

- `has_location`: Number of profiles with legacy location data
- `has_location_search`: Should equal or exceed `has_location`
- `both_synced`: Should equal `has_location` (100% sync rate)

## Known Limitations

1. **Legacy Data:** Profiles with only `location` field will show in view mode but may need manual re-save to populate structured fields
2. **Coordinates:** Latitude/longitude only populated if user re-selects location using autocomplete
3. **Country Parsing:** Legacy data parsing may be inaccurate for non-standard formats

## Rollback Plan

If issues occur, revert these files:

1. `src/types/database.ts`
2. `src/components/profile/ModernProfileEditor.tsx`
3. `src/components/profile/ProfileViewTabs.tsx`
4. `src/components/ui/UserProfileDropdown.tsx`
5. `src/components/dashboard/DashboardLayout.tsx`

Database changes are safe (columns added, not removed).
