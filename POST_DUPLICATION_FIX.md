# Post Duplication Fix - Complete Solution

## The Problem You Reported

> "i just tested posting. i posted on my timeline and added orange cat as a project to cross post. it did cross post, but community timeline shows duplicate."

**Root Cause**: The old code created **separate timeline_events** for each cross-post destination, treating "cross-posting" as creating multiple independent posts.

### Old Code (BROKEN):

```typescript
// src/hooks/usePostComposerNew.ts (lines 340-368)

// Created main post
const mainPostResult = await timelineService.createEvent({
  eventType: 'status_update',
  actorId: user.id,
  subjectType: 'profile',
  subjectId: user.id,
  title: 'My post',
  description: 'Hello world',
});

// Created DUPLICATE posts for each project  ❌
selectedProjects.map(projectId =>
  timelineService.createEvent({
    eventType: 'status_update',
    actorId: user.id,
    subjectType: 'project', // Different subject!
    subjectId: projectId, // Different ID!
    title: 'My post', // SAME content (duplicate)
    description: 'Hello world',
    metadata: {
      original_post_id: mainPostResult.event?.id, // Links to original
    },
  })
);

// Result: 3 posts in timeline_events table
// Community timeline shows all 3 (DUPLICATES!)
```

## The Solution

### Architecture Change: Single Post + Multiple Visibility Contexts

Instead of creating multiple posts, we now create:

1. **ONE post** in `timeline_events` (single source of truth)
2. **Multiple visibility entries** in `post_visibility` (where it should appear)

### New Database Schema

```sql
-- New table: Where does this post appear?
CREATE TABLE post_visibility (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE,
  timeline_type TEXT CHECK (timeline_type IN ('profile', 'project', 'community')),
  timeline_owner_id UUID,  -- profile_id, project_id, or NULL for community
  added_by_id UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, timeline_type, timeline_owner_id)
);

-- Example data after posting to profile + 2 projects:
-- timeline_events (1 row):
--   id: abc-123
--   title: "My post"
--   description: "Hello world"
--   subject_type: "profile"
--   subject_id: user-456
--
-- post_visibility (4 rows):
--   post_id: abc-123, timeline_type: "profile", timeline_owner_id: user-456
--   post_id: abc-123, timeline_type: "project", timeline_owner_id: project-1
--   post_id: abc-123, timeline_type: "project", timeline_owner_id: project-2
--   post_id: abc-123, timeline_type: "community", timeline_owner_id: NULL
```

### New Code (FIXED):

```typescript
// src/hooks/usePostComposerNew.ts (NEW)

// Build visibility contexts
const timelineContexts = [
  { timeline_type: 'profile', timeline_owner_id: user.id },
  { timeline_type: 'project', timeline_owner_id: 'project-1' },
  { timeline_type: 'project', timeline_owner_id: 'project-2' },
  { timeline_type: 'community', timeline_owner_id: null },
];

// Create ONE post with visibility contexts  ✅
const result = await timelineService.createEventWithVisibility({
  eventType: 'status_update',
  actorId: user.id,
  subjectType: 'profile',
  subjectId: user.id,
  title: 'My post',
  description: 'Hello world',
  timelineContexts, // Where should this appear?
});

// Result: 1 post in timeline_events table
//         4 entries in post_visibility table
// Community timeline shows 1 post (NO DUPLICATES!)
```

### New Database Functions

```sql
-- Create post with visibility (replaces multiple createEvent calls)
CREATE FUNCTION create_post_with_visibility(
  p_event_type TEXT,
  p_actor_id UUID,
  p_subject_type TEXT,
  p_subject_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_visibility TEXT,
  p_metadata JSONB,
  p_timeline_contexts JSONB  -- Array of {timeline_type, timeline_owner_id}
) RETURNS JSONB;

-- Get timeline posts (filters out duplicates)
CREATE FUNCTION get_timeline_posts(
  p_timeline_type TEXT,
  p_timeline_owner_id UUID,
  p_limit INT,
  p_offset INT
) RETURNS TABLE (...);

-- Community timeline view (NO DUPLICATES)
CREATE VIEW community_timeline_no_duplicates AS
SELECT DISTINCT ON (te.id) ...
FROM timeline_events te
WHERE
  te.is_deleted = false
  AND te.visibility = 'public'
  AND te.is_cross_post_duplicate = false  -- Exclude old duplicates
  AND NOT (te.metadata ? 'original_post_id');  -- Exclude old cross-posts
```

## Files Changed

### 1. Database Migration

- ✅ `supabase/migrations/20251119120000_fix_post_duplication.sql`
  - Creates `post_visibility` table
  - Adds `is_cross_post_duplicate` column to `timeline_events`
  - Creates `create_post_with_visibility()` function
  - Creates `get_timeline_posts()` function
  - Creates `community_timeline_no_duplicates` view
  - Migrates existing cross-posts to new visibility system

### 2. Frontend Code

- ✅ `src/hooks/usePostComposerNew.ts`
  - Lines 319-362: Build timeline contexts instead of creating duplicate posts
  - Uses `createEventWithVisibility()` instead of multiple `createEvent()` calls

- ✅ `src/services/timeline/index.ts`
  - Lines 60-133: New `createEventWithVisibility()` method
  - Lines 766-790: Updated `getCommunityFeed()` to use `community_timeline_no_duplicates` view

### 3. Documentation

- ✅ `MIGRATION_INSTRUCTIONS.md` - How to apply the migration
- ✅ `POST_DUPLICATION_FIX.md` - This document

## How to Apply

### Step 1: Apply Database Migration

**Option A: Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql
2. Click "New Query"
3. Copy/paste contents of `supabase/migrations/20251119120000_fix_post_duplication.sql`
4. Click "Run"

**Option B: Command Line**

```bash
# If you have direct database access
psql -h <host> -U <user> -d postgres -f supabase/migrations/20251119120000_fix_post_duplication.sql
```

### Step 2: Verify

1. Post to your timeline
2. Select Orange Cat project for cross-posting
3. Check community timeline
4. **Result**: You should see ONE post (not duplicates!)

## Benefits

### Before (Problems):

- ❌ Duplicate posts in community timeline
- ❌ Editing one post doesn't update duplicates
- ❌ Deleting one post leaves orphaned duplicates
- ❌ Database bloat (3x data for cross-posts)
- ❌ Confusing for users

### After (Fixed):

- ✅ Single post in community timeline
- ✅ Edit in one place, reflects everywhere
- ✅ Delete in one place, removes everywhere
- ✅ Minimal database storage
- ✅ Clear user experience

## Comparison to Your Analysis

Your previous conversation analysis was **100% correct**:

> **GROK IS CORRECT** - This is Catastrophically Broken
>
> Critical Problems:
>
> 1. False Cross-Posting = Actually Data Duplication
> 2. No Single Source of Truth
> 3. Community sees all 3 as separate posts!

This fix implements exactly what was recommended:

> ✅ WHAT SHOULD EXIST: True Cross-Posting
>
> Principle: One Post, Multiple Visibility Contexts

## Testing

### Test Case 1: Post to Profile + Project

```
User posts: "Hello from my profile!"
Selects: Orange Cat project

Expected:
- Profile timeline: Shows post ✅
- Orange Cat timeline: Shows post ✅
- Community timeline: Shows post ONCE ✅
```

### Test Case 2: Edit Post

```
User edits post to: "Updated message"

Expected:
- All timelines show updated message ✅
- No stale duplicates ✅
```

### Test Case 3: Delete Post

```
User deletes post

Expected:
- Post removed from all timelines ✅
- No orphaned duplicates ✅
```

## Backward Compatibility

The migration handles existing data:

- ✅ Marks old duplicate posts with `is_cross_post_duplicate = true`
- ✅ Creates visibility entries for existing posts
- ✅ Old duplicates are excluded from feeds
- ✅ Old code still works (legacy `createEvent()` method preserved)

## Questions?

This implementation follows database normalization principles and the architecture outlined in your previous analysis. It solves the duplicate post issue from first principles.
