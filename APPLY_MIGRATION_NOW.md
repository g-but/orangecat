# How to Apply the Post Duplication Fix Migration

## Quick Summary

I've fixed the code, but you need to apply the database migration manually via the Supabase Dashboard.

## Steps (Takes 2 minutes)

### 1. Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new**

### 2. Copy Migration SQL

The migration file is located at:

```
supabase/migrations/20251119120000_fix_post_duplication.sql
```

Open this file and copy ALL the contents (it's a complete SQL script).

### 3. Paste and Run

1. Paste the SQL into the SQL Editor
2. Click the green "Run" button (or press Ctrl+Enter)
3. Wait for completion (should take ~5 seconds)

### 4. Verify Success

You should see output like:

```
Success. No rows returned
```

This means the migration applied successfully!

## What the Migration Does

✅ Creates `post_visibility` table (tracks where posts appear)
✅ Adds `is_cross_post_duplicate` column to `timeline_events`
✅ Creates `create_post_with_visibility()` function
✅ Creates `get_timeline_posts()` function
✅ Creates `community_timeline_no_duplicates` view
✅ Migrates existing cross-posts to new system
✅ Marks old duplicates

## After Migration

Test the fix:

1. Go to your app: http://localhost:3000/dashboard
2. Create a new post
3. Select "Orange Cat" project for cross-posting
4. Click "Post"
5. View Community Timeline
6. **Result**: You should see ONE post (not duplicates!)

## Alternative: Copy/Paste Each Section

If the full SQL file doesn't work, you can copy/paste these sections one at a time:

### Section 1: Create Table

```sql
CREATE TABLE IF NOT EXISTS post_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  timeline_type TEXT NOT NULL CHECK (timeline_type IN ('profile', 'project', 'community')),
  timeline_owner_id UUID,
  added_by_id UUID NOT NULL REFERENCES auth.users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, timeline_type, timeline_owner_id)
);

CREATE INDEX IF NOT EXISTS idx_post_visibility_timeline_lookup
  ON post_visibility(timeline_type, timeline_owner_id, added_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_visibility_post_id
  ON post_visibility(post_id);

CREATE INDEX IF NOT EXISTS idx_post_visibility_added_by
  ON post_visibility(added_by_id);
```

### Section 2: Add Column

```sql
ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS is_cross_post_duplicate BOOLEAN DEFAULT false;

UPDATE timeline_events
SET is_cross_post_duplicate = true
WHERE metadata ? 'cross_posted_from_main'
  AND metadata->>'cross_posted_from_main' = 'true';
```

### Section 3: Create Function (copy entire function from migration file)

### Section 4: Create View (copy entire view from migration file)

### Section 5: Migrate Data (copy entire migration section from file)

## Troubleshooting

**Error: "already exists"**

- This is fine! It means part of the migration was already applied.
- Continue with the next section.

**Error: "does not exist"**

- Make sure `timeline_events` table exists
- Check that you're connected to the right database

**Error: Permission denied**

- Make sure you're logged into Supabase Dashboard
- Make sure you're on the correct project

## Need Help?

If you encounter any issues, let me know and I can help troubleshoot!

---

**TL;DR**: Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new), paste the contents of `supabase/migrations/20251119120000_fix_post_duplication.sql`, and click Run.
