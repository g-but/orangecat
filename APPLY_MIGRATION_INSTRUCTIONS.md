# How to Apply Timeline Social Features Migration

## ✅ What's Already Done:

1. **Migration file created** with likes AND dislikes ✓
2. **Service layer updated** with toggleDislike() method ✓
3. **UI updated** with dislike button ✓

## 🎯 What You Need to Do:

Apply the migration to enable likes, **dislikes (scam detection)**, comments, and shares.

---

## 🚀 Method 1: Supabase Dashboard (EASIEST - 30 seconds)

### Steps:

1. Go to [https://supabase.com/dashboard/project/ohkueislstxomdjavyhs](https://supabase.com/dashboard/project/ohkueislstxomdjavyhs)

2. Click **"SQL Editor"** in the left sidebar

3. Click **"New Query"**

4. Open this file:

   ```
   supabase/migrations/20251113000001_timeline_social_features.sql
   ```

5. **Copy the ENTIRE file contents** (Cmd/Ctrl + A, then Cmd/Ctrl + C)

6. **Paste into Supabase SQL Editor** (Cmd/Ctrl + V)

7. Click **"Run"** (or press Cmd/Ctrl + Enter)

8. Wait for success message:

   ```
   SUCCESS: Timeline social features created successfully
     ✓ Tables: timeline_likes, timeline_dislikes, timeline_shares, timeline_comments
     ✓ View: timeline_event_stats (with dislikes for scam detection)
     ✓ Functions: like/dislike/share/comment timeline events
     ✓ RLS: Policies enabled for all social interaction tables
     ✓ Indexes: Optimized for performance and queries
     ✓ Wisdom of crowds: Dislikes enabled for community moderation
   ```

9. **DONE!** 🎉

---

## 🔍 Method 2: CLI (if you want to fix CLI authentication)

The Supabase CLI is installed but the API token is unauthorized.

### To fix:

1. Get a new API token:
   - Go to Supabase Dashboard → Settings → API
   - Generate a new Service Role key
   - Copy it

2. Update token in `.env`:

   ```bash
   SUPABASE_ACCESS_TOKEN="your-new-token-here"
   ```

3. Run:
   ```bash
   node apply-social-features-migration.js
   ```

### OR use `db push` (requires all migrations):

```bash
npx supabase db push --linked --include-all
```

⚠️ **Warning**: This applies ALL pending migrations, not just this one.

---

## ✅ Verification After Migration:

Run this in Supabase SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('timeline_likes', 'timeline_dislikes', 'timeline_comments', 'timeline_shares')
ORDER BY table_name;

-- Should return 4 rows
```

---

## 🧪 Testing After Migration:

1. **Like a post** → count should increment
2. **Dislike a post** → count should increment (wisdom of crowds!)
3. **Comment on a post** → should appear immediately
4. **Share a post** → count should increment
5. **Private post** → toggle visibility before posting

---

## 🎉 What's Enabled After Migration:

### Likes System

- Users can like posts
- Like counts displayed
- Visual feedback (filled heart)

### **Dislikes System (NEW!)**

- Users can dislike posts
- Dislike counts displayed
- **Purpose**: Scam detection & community moderation
- **Wisdom of crowds**: Let the community flag suspicious content
- Visual feedback (filled thumbs down)

### Comments System

- Users can comment on posts
- Threaded replies support
- Comment counts displayed

### Shares System

- Users can share/repost content
- Share counts displayed
- Optional share text

---

## 🛡️ Wisdom of Crowds - Why Dislikes Matter:

From your original request:

> "we don't just want likes. we also want dislikes. these things allow for more trust building and crowd control over scams. we don't want scams. we want wisdom of the crowds"

**How it works:**

1. User posts suspicious content → Community dislikes it
2. High dislike count = **Red flag** for other users
3. Community self-moderates without censorship
4. Transparent trust signals visible to everyone

**Use cases:**

- Identifying potential scams
- Flagging misleading information
- Community quality control
- Building reputation systems

---

## 📊 Database Schema Added:

```sql
-- LIKES
CREATE TABLE timeline_likes (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES timeline_events,
  user_id uuid REFERENCES profiles,
  created_at timestamptz,
  UNIQUE(event_id, user_id)
);

-- DISLIKES (Scam Detection)
CREATE TABLE timeline_dislikes (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES timeline_events,
  user_id uuid REFERENCES profiles,
  created_at timestamptz,
  UNIQUE(event_id, user_id)
);

-- COMMENTS
CREATE TABLE timeline_comments (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES timeline_events,
  user_id uuid REFERENCES profiles,
  content text,
  parent_comment_id uuid REFERENCES timeline_comments,
  created_at timestamptz,
  ...
);

-- SHARES
CREATE TABLE timeline_shares (
  id uuid PRIMARY KEY,
  original_event_id uuid REFERENCES timeline_events,
  user_id uuid REFERENCES profiles,
  share_text text,
  visibility text,
  created_at timestamptz,
  UNIQUE(original_event_id, user_id)
);
```

---

## 🚨 Troubleshooting:

### "Table already exists" error?

- Migration has already been applied partially
- Check existing tables in Supabase Dashboard → Table Editor
- If some tables exist but not all, you may need to apply specific CREATE TABLE statements

### "Permission denied" error?

- Check you're logged into correct Supabase account
- Verify project ID is correct: `ohkueislstxomdjavyhs`

### Buttons still don't work?

1. Clear browser cache
2. Hard refresh (Cmd/Ctrl + Shift + R)
3. Check browser console for errors
4. Verify migration applied successfully

---

## 📝 Summary:

**What you need to do NOW:**

1. Go to Supabase Dashboard SQL Editor
2. Copy/paste the migration file contents
3. Run it
4. Test likes, dislikes, comments, shares

**Total time:** ~30 seconds

**Files you need:**

- `supabase/migrations/20251113000001_timeline_social_features.sql`

**Once applied:**

- ✅ Users can like posts
- ✅ Users can **dislike posts** (scam detection!)
- ✅ Users can comment on posts
- ✅ Users can share posts
- ✅ All RLS policies enabled
- ✅ Performance indexes created

---

**Questions?** The migration is idempotent (uses `CREATE TABLE IF NOT EXISTS`), so it's safe to run multiple times.
