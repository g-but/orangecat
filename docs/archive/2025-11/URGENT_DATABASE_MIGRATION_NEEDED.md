# URGENT: Database Migration Required for Timeline Features

## Status: ❌ **BLOCKING ISSUE**

## Problem:

The timeline interaction features (likes, comments, shares) are currently **NOT WORKING** because the required database tables don't exist in production.

## What's Broken:

- ❌ **Like button** - can't like posts
- ❌ **Comment posting** - can't add comments
- ❌ **Share button** - can't share posts

## Root Cause:

The migration file `20251113000001_timeline_social_features.sql` has NOT been applied to the production database.

This migration creates:

- `timeline_likes` table
- `timeline_comments` table
- `timeline_shares` table
- RLS policies for all three tables
- Indexes for performance

## Solution:

### Option 1: Use Supabase Dashboard (RECOMMENDED - Fastest)

1. Go to https://supabase.com/dashboard/project/ohkueislstxomdjavyhs
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the ENTIRE contents of `supabase/migrations/20251113000001_timeline_social_features.sql`
5. Paste into the SQL editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. Wait for success message

### Option 2: Fix the Node.js Script

The current `apply-timeline-migration.js` script fails with JSON encoding issues when trying to send SQL via API.

**Quick fix approach:**

```bash
# Split the migration into smaller parts or use proper API endpoint
# (Would need more investigation of Supabase API)
```

### Option 3: Use psql Command Line

```bash
# Get your database password from Supabase Dashboard → Settings → Database
# Then run:
PGPASSWORD="your-password-here" psql \
  -h db.ohkueislstxomdjavyhs.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20251113000001_timeline_social_features.sql
```

## Code Changes Already Made:

✅ **I've already updated the timeline service** to use direct queries instead of RPC functions, so the code will work as soon as the tables exist.

Updated methods (all using direct queries now):

- `toggleLike()` - Direct INSERT/DELETE on `timeline_likes`
- `addComment()` - Direct INSERT on `timeline_comments`
- `shareEvent()` - Direct INSERT on `timeline_shares`
- `getEventComments()` - Direct SELECT with JOIN on `profiles`

## Verification After Migration:

Run this query in Supabase SQL Editor to verify tables were created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('timeline_likes', 'timeline_comments', 'timeline_shares')
ORDER BY table_name;

-- Should return 3 rows
```

## Impact:

**Before migration applied:**

- Users can create posts ✅
- Users can view posts ✅
- Users CANNOT like posts ❌
- Users CANNOT comment on posts ❌
- Users CANNOT share posts ❌

**After migration applied:**

- All timeline features will work ✅
- No code changes needed ✅
- Instant fix ✅

## Priority: P0 - CRITICAL

This blocks core social features that users expect. Apply migration ASAP.

---

**Next Steps:**

1. Apply the migration using Option 1 (Supabase Dashboard)
2. Test that likes, comments, and shares work
3. Delete this file once complete
