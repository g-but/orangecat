# Apply RLS Fix Migration - Instructions

## Quick Fix (Recommended)

The RLS recursion issue is blocking groups functionality. Apply the fix using one of these methods:

### Method 1: Supabase Studio SQL Editor (Easiest)

1. **Open Supabase Studio SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new

2. **Copy the migration SQL:**
   - Open: `supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql`
   - Copy the entire contents

3. **Paste and Execute:**
   - Paste into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify:**
   - Refresh the groups page: http://localhost:3000/groups
   - Try creating a group

### Method 2: Supabase CLI (If you have access token)

```bash
# Get your access token from:
# https://supabase.com/dashboard/account/tokens

export SUPABASE_ACCESS_TOKEN=your_token_here
./scripts/db/apply-rls-fix-direct.sh
```

### Method 3: Manual Application

If both methods above don't work, you can apply the SQL statements one by one in Supabase Studio:

1. Create the functions first:
   - `is_group_member(p_group_id uuid, p_user_id uuid)`
   - `get_user_group_role(p_group_id uuid, p_user_id uuid)`

2. Drop the old policies:
   - `DROP POLICY IF EXISTS "Members can view group members" ON group_members;`
   - `DROP POLICY IF EXISTS "Founders and admins can manage members" ON group_members;`

3. Create the new policies (see migration file for full SQL)

4. Grant permissions:
   - `GRANT EXECUTE ON FUNCTION is_group_member(uuid, uuid) TO authenticated;`
   - `GRANT EXECUTE ON FUNCTION get_user_group_role(uuid, uuid) TO authenticated;`

## What This Fixes

- ✅ Resolves infinite recursion error (42P17) on `group_members` table
- ✅ Enables groups to be listed and created
- ✅ Fixes RLS policies using security definer functions
- ✅ Allows full groups functionality to work

## Verification

After applying, test:
1. Navigate to `/groups` - should load without errors
2. Click "Create Group" - should work
3. Create a test group
4. Navigate to group detail page
5. Check Events, Proposals, Members tabs

## Migration File

Location: `supabase/migrations/20250130000007_fix_group_members_rls_recursion.sql`

Created: 2025-12-31
