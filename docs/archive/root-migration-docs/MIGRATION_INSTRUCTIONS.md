# Post Duplication Fix - Migration Instructions

## Problem

When you post to your timeline and cross-post to projects, the system creates **duplicate timeline events**. This causes the community timeline to show the same post multiple times.

## Solution Architecture

Instead of creating multiple posts, we now create:

1. **ONE post** (single source of truth)
2. **Multiple visibility entries** (where the post should appear)

## Migration Steps

### Step 1: Apply Database Migration

You need to run the SQL migration file in the Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20251119120000_fix_post_duplication.sql`
4. Paste into the SQL editor
5. Click "Run"

This will create:

- ✅ `post_visibility` table - tracks where posts appear
- ✅ `create_post_with_visibility()` function - creates posts without duplicates
- ✅ `get_timeline_posts()` function - retrieves posts for a timeline
- ✅ `community_timeline_no_duplicates` view - community timeline with no duplicates
- ✅ Migration of existing cross-posts to new visibility system

### Step 2: Code Changes (Already Complete)

The following files have been updated:

- ✅ `src/hooks/usePostComposerNew.ts` - Uses new `createEventWithVisibility` method
- ✅ `src/services/timeline/index.ts` - Added new method and updated community feed

### Step 3: Verify Fix

After applying the migration:

1. Post to your timeline
2. Select Orange Cat project for cross-posting
3. Check community timeline
4. ✅ You should see **ONE post**, not duplicates

## Technical Details

### Before (WRONG):

```javascript
// Created 3 separate posts (DUPLICATES!)
Post #1: subject=profile, subject_id=user_id
Post #2: subject=project, subject_id=project_a  // DUPLICATE!
Post #3: subject=project, subject_id=project_b  // DUPLICATE!

// Community timeline shows all 3
```

### After (CORRECT):

```javascript
// Created 1 post with 3 visibility contexts
Post #1: subject=profile, subject_id=user_id

Visibility:
- timeline_type=profile, timeline_owner_id=user_id
- timeline_type=project, timeline_owner_id=project_a
- timeline_type=project, timeline_owner_id=project_b
- timeline_type=community, timeline_owner_id=null

// Community timeline shows 1 post
```

## Database Schema Changes

### New Table: `post_visibility`

```sql
CREATE TABLE post_visibility (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES timeline_events(id),
  timeline_type TEXT,  -- 'profile', 'project', 'community'
  timeline_owner_id UUID,  -- profile_id or project_id (NULL for community)
  added_by_id UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ,
  UNIQUE(post_id, timeline_type, timeline_owner_id)
);
```

### New Column: `timeline_events.is_cross_post_duplicate`

```sql
ALTER TABLE timeline_events
  ADD COLUMN is_cross_post_duplicate BOOLEAN DEFAULT false;
```

This marks old duplicate cross-posts so they don't appear in feeds.

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Remove the new code changes (revert commits)
2. Drop the new tables:

```sql
DROP VIEW IF EXISTS community_timeline_no_duplicates;
DROP FUNCTION IF EXISTS create_post_with_visibility;
DROP FUNCTION IF EXISTS get_timeline_posts;
DROP TABLE IF EXISTS post_visibility;
ALTER TABLE timeline_events DROP COLUMN IF EXISTS is_cross_post_duplicate;
```

## Questions?

This architecture follows the principles outlined in your previous conversation:

- ✅ Single source of truth for posts
- ✅ Separation of "what" (post content) from "where" (visibility)
- ✅ No data duplication
- ✅ Easy to edit/delete (one place)
- ✅ Community timeline shows unique posts
