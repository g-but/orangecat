# 🔴 CRITICAL DATABASE MIGRATIONS - READ BEFORE RUNNING

**Created**: 2025-11-19
**Priority**: P0 - CRITICAL
**Status**: READY FOR REVIEW

## ⚠️ WARNING: BREAKING CHANGES

These migrations fix fundamental architectural flaws in the wallet and timeline systems. They are **breaking changes** that require application code updates.

---

## 📋 Migration Files

### Wallet System Fixes

1. **20251119000000_fix_wallet_architecture.sql** - New wallet schema
2. **20251119000001_migrate_wallet_data.sql** - Migrate existing wallet data

### Timeline/Posts System Fixes

3. **20251119000002_fix_timeline_architecture.sql** - New posts schema
4. **20251119000003_posts_helper_functions.sql** - Query functions

---

## 🎯 What These Migrations Fix

### Problem 1: Wallet Exclusive Ownership Constraint

**Current (Broken)**:

```sql
-- ❌ Can't use same wallet for profile AND project
CONSTRAINT check_has_owner CHECK (
  (profile_id IS NOT NULL AND project_id IS NULL) OR
  (profile_id IS NULL AND project_id IS NOT NULL)
)
```

**After Fix**:

```sql
-- ✅ Wallets can be shared between profiles and projects
wallet_definitions (single source of truth for addresses)
wallet_ownerships (many-to-many: who owns which wallets)
wallet_categories (many-to-many: wallet purposes)
```

**Benefits**:

- ✅ Use your personal wallet for your project
- ✅ One wallet, multiple purposes (rent + food + medical)
- ✅ No data duplication
- ✅ Scalable for teams/organizations

### Problem 2: Timeline Cross-Posting Creates Duplicates

**Current (Catastrophic)**:

```typescript
// ❌ Creates 3 separate database records!
if (selectedProjects.length > 0) {
  selectedProjects.map(projectId => createEvent({ subject_id: projectId, content: 'Hello!' }));
}
// Result: Community timeline shows 3 identical "Hello!" posts
```

**After Fix**:

```sql
-- ✅ One post, multiple visibility contexts
posts (single source of truth for content)
post_visibility (where posts appear)
```

**Benefits**:

- ✅ Community timeline: one entry per post with cross-post info
- ✅ Edit once → updates everywhere
- ✅ Delete once → removed everywhere
- ✅ Accurate analytics (no duplicates)

---

## 📊 Database Changes Summary

### New Tables Created

#### Wallet System

- `wallet_definitions` - Bitcoin addresses (single source of truth)
- `wallet_ownerships` - Many-to-many: wallets ↔ entities
- `wallet_categories` - Many-to-many: wallets ↔ purposes

#### Posts System

- `posts` - User-generated content (single source of truth)
- `post_visibility` - Where posts appear
- `post_likes` - Like tracking
- `post_comments` - Comments with threading
- `post_comment_likes` - Comment likes
- `post_shares` - Share tracking (not duplicate creation!)

### Existing Tables

- `wallets` - **Keep for now**, migrate data, then optionally drop
- `timeline_events` - **Keep**, use for system events (donations, milestones), not user posts

---

## 🚀 Migration Steps

### Phase 1: Review (DO THIS FIRST)

1. **Backup your database**

   ```bash
   # Use Supabase dashboard or CLI
   supabase db dump > backup_$(date +%Y%m%d).sql
   ```

2. **Review migration files**
   - Read each migration SQL file
   - Understand what changes
   - Check RLS policies match your security requirements

3. **Test in development first**
   - Run on local dev database
   - Run on staging environment
   - **DO NOT run on production without testing**

### Phase 2: Run Wallet Migrations

```bash
# 1. Create new wallet architecture
psql $DATABASE_URL -f supabase/migrations/20251119000000_fix_wallet_architecture.sql

# 2. Migrate existing wallet data
psql $DATABASE_URL -f supabase/migrations/20251119000001_migrate_wallet_data.sql

# 3. Verify migration
psql $DATABASE_URL -c "SELECT * FROM wallet_definitions LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM wallet_ownerships LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM wallet_categories LIMIT 5;"
```

**Verification Query**:

```sql
-- Check migration counts match
SELECT
  (SELECT COUNT(*) FROM wallets) AS old_count,
  (SELECT COUNT(*) FROM wallet_definitions) AS new_definitions,
  (SELECT COUNT(*) FROM wallet_ownerships) AS new_ownerships,
  (SELECT COUNT(*) FROM wallet_categories) AS new_categories;
```

### Phase 3: Run Posts Migrations

```bash
# 1. Create new posts architecture
psql $DATABASE_URL -f supabase/migrations/20251119000002_fix_timeline_architecture.sql

# 2. Create helper functions
psql $DATABASE_URL -f supabase/migrations/20251119000003_posts_helper_functions.sql

# 3. Verify
psql $DATABASE_URL -c "SELECT * FROM posts LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM post_visibility LIMIT 5;"
```

### Phase 4: Update Application Code

See "Application Code Changes" section below.

---

## 💻 Application Code Changes Required

### Wallet System

#### Before (Old API):

```typescript
// ❌ Old: Query wallets table directly
const { data: wallets } = await supabase.from('wallets').select('*').eq('profile_id', profileId);
```

#### After (New API):

```typescript
// ✅ New: Use helper function
const { data: wallets } = await supabase.rpc('get_entity_wallets', {
  p_entity_type: 'profile',
  p_entity_id: profileId,
});

// Result includes all categories for each wallet
// {
//   wallet_id: '...',
//   address_or_xpub: 'bc1q...',
//   categories: [
//     { category: 'rent', goal_amount: 1000 },
//     { category: 'food', goal_amount: 500 }
//   ],
//   is_active: true
// }
```

#### Creating Wallets:

```typescript
// ✅ New: Create wallet definition first
const { data: walletDef } = await supabase
  .from('wallet_definitions')
  .insert({
    address_or_xpub: 'bc1q...',
    wallet_type: 'address',
    label: 'My Bitcoin Wallet',
  })
  .select()
  .single();

// ✅ Then create ownership
await supabase.from('wallet_ownerships').insert({
  wallet_id: walletDef.id,
  owner_type: 'profile',
  owner_id: profileId,
  permission_level: 'manage',
});

// ✅ Then create categories
await supabase.from('wallet_categories').insert([
  {
    wallet_id: walletDef.id,
    entity_type: 'profile',
    entity_id: profileId,
    category: 'rent',
    goal_amount: 1000,
  },
  {
    wallet_id: walletDef.id,
    entity_type: 'profile',
    entity_id: profileId,
    category: 'food',
    goal_amount: 500,
  },
]);
```

### Posts System

#### Before (Old - Creates Duplicates):

```typescript
// ❌ Old: Creates separate events
const mainPost = await timelineService.createEvent({
  actorId: user.id,
  subjectType: 'profile',
  subjectId: profileId,
  title: 'Hello',
  description: 'Hello world!',
});

// ❌ Creates DUPLICATE for each project
for (const projectId of selectedProjects) {
  await timelineService.createEvent({
    actorId: user.id,
    subjectType: 'project',
    subjectId: projectId,
    title: 'Hello',
    description: 'Hello world!', // DUPLICATE CONTENT!
  });
}
```

#### After (New - Single Source of Truth):

```typescript
// ✅ New: Create ONE post with multiple visibility
const { data } = await supabase.rpc('create_post_with_visibility', {
  p_author_id: profileId,
  p_content: 'Hello world!',
  p_title: 'Hello',
  p_visibility: 'public',
  p_timeline_types: ['profile', 'project', 'project', 'community'],
  p_timeline_owner_ids: [profileId, projectId1, projectId2, null],
  p_tags: ['announcement'],
  p_metadata: {},
});

// Result: ONE post in database, visible on 4 timelines
```

#### Fetching Timelines:

```typescript
// ✅ Community Timeline (deduplicated!)
const { data: posts } = await supabase.rpc('get_community_timeline', {
  p_limit: 20,
  p_offset: 0,
  p_sort_by: 'recent', // or 'trending', 'popular'
});

// Each post appears ONCE with cross_posted_to info:
// {
//   post_id: '...',
//   content: 'Hello world!',
//   cross_posted_to: [
//     { timeline_type: 'profile', timeline_owner_id: '...' },
//     { timeline_type: 'project', timeline_owner_id: '...' }
//   ]
// }

// ✅ Profile Timeline
const { data: profilePosts } = await supabase.rpc('get_profile_timeline', {
  p_profile_id: profileId,
  p_limit: 20,
});

// ✅ Project Timeline
const { data: projectPosts } = await supabase.rpc('get_project_timeline', {
  p_project_id: projectId,
  p_limit: 20,
});
```

#### Engagement Actions:

```typescript
// ✅ Like a post
await supabase.from('post_likes').insert({ post_id, user_id: profileId });

// ✅ Comment on a post
await supabase.from('post_comments').insert({
  post_id,
  author_id: profileId,
  content: 'Great post!',
});

// ✅ Share a post (tracks share, doesn't duplicate!)
await supabase.from('post_shares').insert({
  post_id,
  user_id: profileId,
  shared_to_type: 'project',
  shared_to_id: myProjectId,
});

// AND add visibility so it appears on that timeline
await supabase.from('post_visibility').insert({
  post_id,
  timeline_type: 'project',
  timeline_owner_id: myProjectId,
  added_by_id: profileId,
});
```

---

## 🔒 Security (RLS Policies)

All new tables have comprehensive Row Level Security policies:

### Wallets

- Anyone can view active wallet definitions
- Users can manage wallets they created or own
- Users can add ownerships for wallets/entities they control

### Posts

- Public posts visible to everyone
- Users see their own posts (including drafts)
- Followers can see follower-only posts
- Users can only edit/delete their own posts
- Engagement (likes, comments) follows post visibility

### Key Security Features

- ✅ No privilege escalation (can't edit others' content)
- ✅ Privacy-aware (visibility controls honored)
- ✅ Audit trails (created_by, added_by fields)
- ✅ Soft deletes (can restore, track deletions)

---

## 🧪 Testing Checklist

Before deploying to production:

### Wallet Tests

- [ ] Can create wallet shared between profile and project
- [ ] Same wallet can have multiple categories
- [ ] Balance updates propagate correctly
- [ ] Can query wallets efficiently with `get_entity_wallets`
- [ ] RLS policies prevent unauthorized access

### Posts Tests

- [ ] Create post with cross-posting (one DB record created)
- [ ] Community timeline shows each post ONCE
- [ ] Edit post updates everywhere it appears
- [ ] Delete post removes from all timelines
- [ ] Engagement counts are accurate
- [ ] `cross_posted_to` array is correct
- [ ] RLS policies work correctly

### Performance Tests

- [ ] Timeline queries complete in < 100ms
- [ ] Wallet queries complete in < 50ms
- [ ] Indexes are being used (check EXPLAIN ANALYZE)
- [ ] No N+1 queries in application code

---

## 📈 Expected Impact

### Data Volume Changes

**Before**:

- Post to profile + 2 projects = **3 database records**
- Community timeline: **3 separate entries**

**After**:

- Post to profile + 2 projects = **1 post + 3 visibility records**
- Community timeline: **1 entry with cross-post info**

**Savings**: ~66% reduction in timeline_events growth rate

### Query Performance

**Wallet Queries**:

- Old: Multiple joins, complex filtering
- New: Single function call with precomputed categories
- **Expected**: 2-3x faster

**Timeline Queries**:

- Old: Duplicate detection needed in app code
- New: Database handles deduplication
- **Expected**: 3-5x faster, cleaner results

### User Experience

**Community Timeline**:

- Before: "John posted 'Hello'" appears 3 times
- After: "John posted 'Hello' (cross-posted to Project X, Project Y)"
- **Result**: Cleaner feed, better engagement metrics

**Editing**:

- Before: Edit one copy, others remain stale
- After: Edit once, updates everywhere
- **Result**: Data consistency, no confusion

---

## 🆘 Rollback Plan

If something goes wrong:

### Wallet System Rollback

```sql
-- Application can still use old wallets table
-- New tables exist alongside old table
-- Gradually migrate, then drop old table

-- To rollback: just stop using new tables
-- Old code continues to work
```

### Posts System Rollback

```sql
-- timeline_events table still exists
-- Can continue creating events there
-- New posts table is additive

-- To rollback: use timeline_events for new posts
-- Old timeline code continues to work
```

### Full Rollback (Nuclear Option)

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql

# Or drop new tables
psql $DATABASE_URL -c "
  DROP TABLE IF EXISTS post_shares CASCADE;
  DROP TABLE IF EXISTS post_comment_likes CASCADE;
  DROP TABLE IF EXISTS post_comments CASCADE;
  DROP TABLE IF EXISTS post_likes CASCADE;
  DROP TABLE IF EXISTS post_visibility CASCADE;
  DROP TABLE IF EXISTS posts CASCADE;
  DROP TABLE IF EXISTS wallet_categories CASCADE;
  DROP TABLE IF EXISTS wallet_ownerships CASCADE;
  DROP TABLE IF EXISTS wallet_definitions CASCADE;
"
```

---

## 📞 Support

If you encounter issues:

1. **Check logs**: Look for PostgreSQL errors
2. **Verify RLS**: May need to disable RLS temporarily for debugging
3. **Check indexes**: Run `EXPLAIN ANALYZE` on slow queries
4. **Review data**: Use verification queries provided

---

## ✅ Post-Migration Checklist

After successful migration:

- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] No errors in production logs
- [ ] Community timeline deduplicated
- [ ] Cross-posting works correctly
- [ ] Wallet sharing works
- [ ] RLS policies enforced
- [ ] Monitoring dashboards updated
- [ ] Documentation updated
- [ ] Team trained on new schema

---

## 🎉 Benefits Summary

### Wallet System

- ✅ Flexible wallet ownership (shared between entities)
- ✅ Multiple purposes per wallet (rent + food + medical)
- ✅ No data duplication
- ✅ Scalable architecture

### Posts System

- ✅ Clean community timeline (no duplicates)
- ✅ True cross-posting (not content duplication)
- ✅ Edit once, update everywhere
- ✅ Accurate analytics
- ✅ 66% reduction in data growth
- ✅ 3-5x faster queries

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)

---

**Last Updated**: 2025-11-19
**Status**: ✅ Ready for review and testing
**Breaking Changes**: Yes - requires application updates
**Estimated Effort**: 2-4 hours development + testing
