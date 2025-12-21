# Post Duplication Fix - Visual Diagram

## Before (BROKEN) ❌

### User Action:

```
User posts: "Hello World!"
Cross-posts to: Orange Cat Project
```

### Database State:

```
┌─────────────────────────────────────────────────────────────┐
│ timeline_events table                                        │
├──────────┬─────────────┬──────────────┬─────────────────────┤
│ id       │ subject_type│ subject_id   │ description         │
├──────────┼─────────────┼──────────────┼─────────────────────┤
│ post-1   │ profile     │ user-123     │ "Hello World!"      │ ← Original
│ post-2   │ project     │ orange-cat   │ "Hello World!"      │ ← DUPLICATE!
└──────────┴─────────────┴──────────────┴─────────────────────┘
                                    2 SEPARATE POSTS
```

### Community Timeline Display:

```
┌──────────────────────────────────────────────┐
│ 🌍 Community Timeline                        │
├──────────────────────────────────────────────┤
│                                              │
│ 👤 You posted:                               │
│ "Hello World!"                               │  ← Shows once
│ 🕐 5 minutes ago                             │
│                                              │
│ 👤 You posted on Orange Cat:                 │
│ "Hello World!"                               │  ← DUPLICATE!
│ 🕐 5 minutes ago                             │
│                                              │
└──────────────────────────────────────────────┘
                USER SEES DUPLICATE!
```

---

## After (FIXED) ✅

### User Action:

```
User posts: "Hello World!"
Cross-posts to: Orange Cat Project
```

### Database State:

```
┌─────────────────────────────────────────────────────────────┐
│ timeline_events table                                        │
├──────────┬─────────────┬──────────────┬─────────────────────┤
│ id       │ subject_type│ subject_id   │ description         │
├──────────┼─────────────┼──────────────┼─────────────────────┤
│ post-1   │ profile     │ user-123     │ "Hello World!"      │ ← SINGLE POST
└──────────┴─────────────┴──────────────┴─────────────────────┘
                            1 POST (Single Source of Truth)

┌─────────────────────────────────────────────────────────────┐
│ post_visibility table (NEW!)                                │
├──────────┬───────────────┬──────────────────────────────────┤
│ post_id  │ timeline_type │ timeline_owner_id                │
├──────────┼───────────────┼──────────────────────────────────┤
│ post-1   │ profile       │ user-123                         │ ← Show on user profile
│ post-1   │ project       │ orange-cat                       │ ← Show on project
│ post-1   │ community     │ NULL                             │ ← Show on community
└──────────┴───────────────┴──────────────────────────────────┘
                   Where should this post appear?
```

### Community Timeline Display:

```
┌──────────────────────────────────────────────┐
│ 🌍 Community Timeline                        │
├──────────────────────────────────────────────┤
│                                              │
│ 👤 You posted:                               │
│ "Hello World!"                               │  ← Shows ONCE
│ 🕐 5 minutes ago                             │
│                                              │
│ 👤 Alice posted:                             │
│ "Welcome to the community!"                  │
│ 🕐 10 minutes ago                            │
│                                              │
└──────────────────────────────────────────────┘
                NO DUPLICATES!
```

---

## Architecture Comparison

### Before: Multiple Posts ❌

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  User Posts "Hello"                                     │
│  + Cross-post to Projects A, B                          │
│                                                         │
│         ↓                                               │
│                                                         │
│  Creates 3 SEPARATE timeline_events:                    │
│  ┌──────────────────────────────────────────┐          │
│  │ Post 1: subject=profile, subject_id=user │          │
│  │ Post 2: subject=project, subject_id=A    │ ← DUP   │
│  │ Post 3: subject=project, subject_id=B    │ ← DUP   │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Community Timeline Query:                              │
│  SELECT * FROM timeline_events                          │
│  WHERE visibility = 'public'                            │
│                                                         │
│  Returns: 3 rows (ALL DUPLICATES!)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### After: Single Post + Visibility ✅

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  User Posts "Hello"                                     │
│  + Cross-post to Projects A, B                          │
│                                                         │
│         ↓                                               │
│                                                         │
│  Creates 1 timeline_event:                              │
│  ┌──────────────────────────────────────────┐          │
│  │ Post 1: subject=profile, subject_id=user │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Creates 4 visibility entries:                          │
│  ┌──────────────────────────────────────────┐          │
│  │ Visibility 1: timeline_type=profile      │          │
│  │ Visibility 2: timeline_type=project (A)  │          │
│  │ Visibility 3: timeline_type=project (B)  │          │
│  │ Visibility 4: timeline_type=community    │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  Community Timeline Query:                              │
│  SELECT DISTINCT ON (te.id) *                           │
│  FROM community_timeline_no_duplicates                  │
│                                                         │
│  Returns: 1 row (NO DUPLICATES!)                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow Comparison

### Before (Wrong):

```
┌──────────────────┐
│ User clicks POST │
└────────┬─────────┘
         │
         ├──────────────────────────────────────────────┐
         │                                              │
         ↓                                              ↓
┌────────────────────┐                      ┌──────────────────────┐
│ Create Main Post   │                      │ Create Cross-Post 1  │
│                    │                      │                      │
│ INSERT INTO        │                      │ INSERT INTO          │
│ timeline_events    │                      │ timeline_events      │
│ VALUES (           │                      │ VALUES (             │
│   subject=profile  │                      │   subject=project    │
│   content="Hello"  │                      │   content="Hello"    │ ← DUPLICATE!
│ )                  │                      │   metadata={         │
└────────────────────┘                      │     original_post_id │
                                            │   }                  │
                                            │ )                    │
                                            └──────────────────────┘

Result: Multiple rows in timeline_events ❌
```

### After (Correct):

```
┌──────────────────┐
│ User clicks POST │
└────────┬─────────┘
         │
         ↓
┌────────────────────────────────────────────┐
│ Create Post with Visibility                │
│                                            │
│ CALL create_post_with_visibility(          │
│   event_type='status_update',              │
│   content='Hello',                         │
│   timeline_contexts=[                      │
│     {type: profile, owner: user-123},      │
│     {type: project, owner: project-A},     │
│     {type: community, owner: null}         │
│   ]                                        │
│ )                                          │
│                                            │
│ Function executes:                         │
│   1. INSERT INTO timeline_events (1 row)   │ ← Single source of truth
│   2. INSERT INTO post_visibility (3 rows)  │ ← Where it appears
│                                            │
└────────────────────────────────────────────┘

Result: 1 post + visibility contexts ✅
```

---

## Real Example

### Scenario: You post an update about Orange Cat

```
Post Content: "Orange Cat just hit 50% funding! 🎉"
Cross-post to: Orange Cat Project, Bitcoin Builders Project
```

### Old System (BROKEN):

```sql
-- 3 SEPARATE POSTS IN timeline_events
Row 1: {
  id: 'abc-1',
  subject_type: 'profile',
  subject_id: 'your-user-id',
  description: 'Orange Cat just hit 50% funding! 🎉'
}

Row 2: {
  id: 'abc-2',  ← Different ID!
  subject_type: 'project',
  subject_id: 'orange-cat-id',
  description: 'Orange Cat just hit 50% funding! 🎉',  ← DUPLICATE CONTENT
  metadata: { original_post_id: 'abc-1' }
}

Row 3: {
  id: 'abc-3',  ← Different ID!
  subject_type: 'project',
  subject_id: 'bitcoin-builders-id',
  description: 'Orange Cat just hit 50% funding! 🎉',  ← DUPLICATE CONTENT
  metadata: { original_post_id: 'abc-1' }
}

-- Community Timeline Query
SELECT * FROM timeline_events WHERE visibility='public'
-- Returns: 3 rows → USER SEES 3 DUPLICATE POSTS ❌
```

### New System (FIXED):

```sql
-- 1 POST IN timeline_events
timeline_events:
{
  id: 'xyz-1',
  subject_type: 'profile',
  subject_id: 'your-user-id',
  description: 'Orange Cat just hit 50% funding! 🎉',
  is_cross_post_duplicate: false
}

-- 4 VISIBILITY ENTRIES IN post_visibility
post_visibility:
Row 1: { post_id: 'xyz-1', timeline_type: 'profile',   timeline_owner_id: 'your-user-id' }
Row 2: { post_id: 'xyz-1', timeline_type: 'project',   timeline_owner_id: 'orange-cat-id' }
Row 3: { post_id: 'xyz-1', timeline_type: 'project',   timeline_owner_id: 'bitcoin-builders-id' }
Row 4: { post_id: 'xyz-1', timeline_type: 'community', timeline_owner_id: null }

-- Community Timeline Query
SELECT DISTINCT ON (te.id) * FROM community_timeline_no_duplicates
-- Returns: 1 row → USER SEES 1 POST ✅
```

---

## Summary

| Aspect                 | Before (BROKEN)            | After (FIXED)                 |
| ---------------------- | -------------------------- | ----------------------------- |
| **Database rows**      | 3 posts in timeline_events | 1 post + 4 visibility entries |
| **Community timeline** | Shows 3 duplicates         | Shows 1 post                  |
| **Edit post**          | Must edit 3 places         | Edit in 1 place               |
| **Delete post**        | Must delete 3 places       | Delete in 1 place             |
| **Data integrity**     | Duplicates can diverge     | Single source of truth        |
| **Storage**            | 3x bloat                   | Minimal                       |
| **User experience**    | Confusing duplicates       | Clean timeline                |

**Result: Problem solved! ✅**
