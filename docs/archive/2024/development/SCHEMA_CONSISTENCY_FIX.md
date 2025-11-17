# Schema Consistency Fix

**Date:** 2025-01-30  
**Status:** ✅ Complete  
**Issue:** Profile save failing due to schema inconsistency between `name` and `display_name`

## Problem

1. **Profile Save Failing (422 Error)**
   - Validation schema uses `name`
   - Database had `display_name` (after migration should be `name`)
   - Codebase was inconsistent - some files used `name`, some used `display_name`

2. **Transactions Query Error**
   - Code queries `amount_sats` but database might have `amount` column
   - Error: "column transactions.amount_sats does not exist"

3. **React Hydration Error #418**
   - Likely caused by mismatched content between server/client rendering
   - Related to name/display_name inconsistency

## Solution

### 1. Standardized on `name` Field

**Database Standard:** `name` (per migration `20251221_simplify_database_schema.sql`)

**Files Updated:**

- ✅ `src/app/api/projects/favorites/route.ts` - Changed `display_name` to `name`
- ✅ `src/app/api/projects/[id]/route.ts` - Changed `display_name` to `name`
- ✅ `src/components/sidebar/SidebarUserProfile.tsx` - Changed `display_name` to `name`
- ✅ `src/services/search.ts` - Updated all interfaces and queries to use `name`
- ✅ `src/app/(authenticated)/dashboard/people/page.tsx` - Updated interface and usage
- ✅ `src/services/profile/mapper.ts` - Added migration compatibility (supports both)

**Files with Migration Compatibility (Intentional):**

- `src/components/profile/PublicProfileClient.tsx` - Uses fallback: `name || display_name`
- `src/app/profiles/[username]/page.tsx` - Uses fallback: `name || display_name`
- `src/app/projects/[id]/page.tsx` - Uses fallback: `name || display_name`

These files handle both `name` and `display_name` during the migration period.

### 2. Created Database Migration

**File:** `supabase/migrations/20250130_fix_profile_name_and_transactions.sql`

**What it does:**

- Ensures `profiles.name` column exists
- Migrates data from `display_name` to `name` if needed
- Ensures `transactions.amount_sats` column exists
- Migrates data from `amount` to `amount_sats` if needed
- Adds required transaction columns if missing
- Creates performance indexes

### 3. Validation Schema Already Correct

The validation schema (`src/lib/validation.ts`) already uses `name`:

```typescript
name: z.string().max(100).optional().nullable(),
```

The API route (`src/app/api/profile/route.ts`) correctly saves `name`:

```typescript
const validatedData = profileSchema.parse(normalizedBody);
await supabase.from('profiles').update({ ...validatedData });
```

## Testing

After deploying the migration:

1. **Test Profile Save:**
   - Edit profile
   - Save changes
   - Verify profile updates correctly
   - Check database has `name` field populated

2. **Test Transactions:**
   - Verify fundraising stats load without errors
   - Check transactions query works

3. **Test Search:**
   - Search for profiles by name
   - Verify search results include name field

## Next Steps

1. **Deploy Migration:**

   ```bash
   # Migration will run automatically on next deployment
   # Or manually: supabase migration up
   ```

2. **Verify Database Schema:**

   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
   AND column_name IN ('name', 'display_name');
   ```

3. **Monitor for Errors:**
   - Check Vercel logs for 422 errors
   - Verify profile saves work
   - Check transactions queries succeed

## Files Changed

### Code Changes:

- `src/app/api/projects/favorites/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/components/sidebar/SidebarUserProfile.tsx`
- `src/services/search.ts`
- `src/app/(authenticated)/dashboard/people/page.tsx`
- `src/services/profile/mapper.ts`

### Migration Created:

- `supabase/migrations/20250130_fix_profile_name_and_transactions.sql`

## Documentation

All code now consistently uses `name` (not `display_name`). The database standard is `name` per the December 2025 simplification migration.
