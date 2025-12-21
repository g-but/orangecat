# 🔍 CRITICAL AUDIT REPORT: Migration Review

**Audited By**: Claude (Sonnet 4.5)
**Date**: 2025-11-19
**Method**: First Principles Analysis
**Status**: ⚠️ **CRITICAL ISSUES FOUND**

---

## 🚨 CRITICAL ISSUES (Must Fix Before Running)

### Issue #1: Missing Foreign Key Constraints ❌ CRITICAL

**Location**: `wallet_ownerships.owner_id` and `wallet_categories.entity_id`

**Problem**: These fields reference `profiles.id` or `projects.id` depending on `owner_type`/`entity_type`, but **have NO foreign key constraint**. This means:

- Invalid IDs can be inserted
- Orphaned records if profile/project is deleted
- No referential integrity enforcement

**Example of What Can Go Wrong**:

```sql
-- This succeeds even if profile doesn't exist!
INSERT INTO wallet_ownerships (wallet_id, owner_type, owner_id)
VALUES ('wallet-1', 'profile', 'non-existent-uuid'); -- ❌ No error!

-- Profile gets deleted, but ownership record remains
DELETE FROM profiles WHERE id = 'profile-1';
-- ❌ Orphaned record in wallet_ownerships still exists
```

**Current Code (Broken)**:

```sql
-- wallet_ownerships
owner_type TEXT NOT NULL CHECK (owner_type IN ('profile', 'project')),
owner_id UUID NOT NULL,  -- ❌ NO FOREIGN KEY!

-- wallet_categories
entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'project')),
entity_id UUID NOT NULL,  -- ❌ NO FOREIGN KEY!
```

**Why This is Hard**: PostgreSQL doesn't support conditional foreign keys (can't do "IF owner_type='profile' THEN REFERENCES profiles ELSE REFERENCES projects").

**Solutions**:

**Option A: Add Check Constraints (Validate at Insert)**

```sql
-- Add constraint to ensure owner_id exists
ALTER TABLE wallet_ownerships ADD CONSTRAINT check_owner_exists CHECK (
  (owner_type = 'profile' AND EXISTS (SELECT 1 FROM profiles WHERE id = owner_id)) OR
  (owner_type = 'project' AND EXISTS (SELECT 1 FROM projects WHERE id = owner_id))
);
```

**Downside**: Doesn't prevent orphans if profile/project deleted later.

**Option B: Use Triggers (Recommended)**

```sql
-- Trigger to validate on insert/update
CREATE OR REPLACE FUNCTION validate_wallet_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_type = 'profile' AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.owner_id) THEN
    RAISE EXCEPTION 'Profile % does not exist', NEW.owner_id;
  END IF;

  IF NEW.owner_type = 'project' AND NOT EXISTS (SELECT 1 FROM projects WHERE id = NEW.owner_id) THEN
    RAISE EXCEPTION 'Project % does not exist', NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_wallet_ownership_trigger
  BEFORE INSERT OR UPDATE ON wallet_ownerships
  FOR EACH ROW EXECUTE FUNCTION validate_wallet_ownership();

-- Trigger to clean up on delete
CREATE OR REPLACE FUNCTION cleanup_wallet_ownerships()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM wallet_ownerships
  WHERE owner_type = TG_ARGV[0] AND owner_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_wallet_ownerships_on_profile_delete
  AFTER DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION cleanup_wallet_ownerships('profile');

CREATE TRIGGER cleanup_wallet_ownerships_on_project_delete
  AFTER DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION cleanup_wallet_ownerships('project');
```

**Option C: Separate Tables (Most Robust)**

```sql
-- Split into two tables with proper FKs
CREATE TABLE wallet_profile_ownerships (
  id UUID PRIMARY KEY,
  wallet_id UUID REFERENCES wallet_definitions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- ✅ FK!
  permission_level TEXT,
  UNIQUE(wallet_id, profile_id)
);

CREATE TABLE wallet_project_ownerships (
  id UUID PRIMARY KEY,
  wallet_id UUID REFERENCES wallet_definitions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,  -- ✅ FK!
  permission_level TEXT,
  UNIQUE(wallet_id, project_id)
);
```

**Upside**: Proper referential integrity, database-enforced.
**Downside**: More tables, queries need UNION.

---

### Issue #2: Similar Problem in `post_visibility.timeline_owner_id` ❌ CRITICAL

**Location**: `post_visibility.timeline_owner_id`

**Problem**: Same issue - references profiles OR projects based on `timeline_type`, but no FK.

**Current Code**:

```sql
timeline_type TEXT NOT NULL CHECK (timeline_type IN ('profile', 'project', 'community')),
timeline_owner_id UUID,  -- ❌ NO FOREIGN KEY! Can be invalid profile/project ID
```

**Same Solutions Apply**: Triggers or separate tables.

---

### Issue #3: RLS Policies Reference Deleted Entities ⚠️ HIGH

**Location**: All RLS policies using `EXISTS` queries with profiles/projects

**Problem**: RLS policies check if owner exists, but if using `EXISTS (SELECT 1 FROM profiles WHERE id = owner_id)`, this **doesn't validate that owner_id is correct for the row**.

**Example**:

```sql
-- Current RLS policy
CREATE POLICY "wallet_ownerships_insert_own"
  ON public.wallet_ownerships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = owner_id
        AND p.user_id = auth.uid()
        AND owner_type = 'profile'
    )
  );
```

**Issue**: What if `owner_type = 'project'` but `owner_id` is actually a profile ID? The policy would incorrectly allow this.

**Fix**: Need more rigorous validation:

```sql
CREATE POLICY "wallet_ownerships_insert_own"
  ON public.wallet_ownerships FOR INSERT
  WITH CHECK (
    auth.uid() = added_by AND (
      -- Validate owner exists AND matches type
      (owner_type = 'profile' AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = owner_id AND p.user_id = auth.uid()
      )) OR
      (owner_type = 'project' AND EXISTS (
        SELECT 1 FROM projects pr
        WHERE pr.id = owner_id AND pr.user_id = auth.uid()
      ))
    )
  );
```

---

### Issue #4: Data Migration Doesn't Handle Duplicates Correctly ⚠️ HIGH

**Location**: `20251119000001_migrate_wallet_data.sql`

**Problem**: Uses `DISTINCT ON (address_or_xpub)` which arbitrarily picks first record.

**Current Code**:

```sql
SELECT DISTINCT ON (address_or_xpub)
  gen_random_uuid(),
  address_or_xpub,
  -- ...
FROM public.wallets
ORDER BY address_or_xpub, created_at;
```

**Issue**: If same address has different labels/descriptions, we lose data.

**Better Approach**:

```sql
-- Deduplicate intelligently: prefer most recently updated, most complete data
SELECT DISTINCT ON (address_or_xpub)
  gen_random_uuid(),
  address_or_xpub,
  wallet_type,
  -- Pick non-null label if available
  COALESCE(
    MAX(label) FILTER (WHERE label IS NOT NULL),
    'Imported Wallet'
  ) as label,
  -- Pick non-null description
  MAX(description) FILTER (WHERE description IS NOT NULL) as description,
  -- Use highest balance
  MAX(balance_btc) as balance_btc,
  -- Most recent balance update
  MAX(balance_updated_at) as balance_updated_at,
  -- First creator
  MIN(user_id) as created_by,
  -- Earliest creation
  MIN(created_at) as created_at,
  -- Most recent update
  MAX(updated_at) as updated_at
FROM public.wallets
GROUP BY address_or_xpub, wallet_type
ORDER BY address_or_xpub;
```

---

### Issue #5: `get_entity_wallets` Function Inefficiency ⚠️ MEDIUM

**Location**: `get_entity_wallets()` function

**Problem**: Uses `bool_or(wc.is_active)` which means a wallet is "active" if **any** category is active. This might not be the intended behavior.

**Current Logic**:

```sql
COALESCE(bool_or(wc.is_active), false) as is_active
```

**Question**: Should a wallet be considered "active" if:

- ANY category is active? (current)
- ALL categories are active?
- The wallet_ownership is active? (we don't track this)

**Recommendation**: Add `is_active` to `wallet_ownerships` table:

```sql
ALTER TABLE wallet_ownerships
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
```

Then use that instead of deriving from categories.

---

### Issue #6: Missing Validation in `create_post_with_visibility` ⚠️ MEDIUM

**Location**: `create_post_with_visibility()` function

**Problem**: Doesn't validate that `p_timeline_types` and `p_timeline_owner_ids` arrays match in length.

**Current Code**:

```sql
FOR v_i IN 1..array_length(p_timeline_types, 1) LOOP
  v_timeline_type := p_timeline_types[v_i];
  v_timeline_owner_id := p_timeline_owner_ids[v_i];  -- ❌ Can be NULL if arrays don't match!
```

**Fix**:

```sql
-- Add validation at start of function
IF array_length(p_timeline_types, 1) != array_length(p_timeline_owner_ids, 1) THEN
  RAISE EXCEPTION 'timeline_types and timeline_owner_ids must have same length';
END IF;

-- Also validate timeline_type/timeline_owner_id matching
FOR v_i IN 1..array_length(p_timeline_types, 1) LOOP
  v_timeline_type := p_timeline_types[v_i];
  v_timeline_owner_id := p_timeline_owner_ids[v_i];

  -- Validate: community timeline should have NULL owner
  IF v_timeline_type = 'community' AND v_timeline_owner_id IS NOT NULL THEN
    RAISE EXCEPTION 'Community timeline should not have owner_id';
  END IF;

  -- Validate: profile/project timeline MUST have owner
  IF v_timeline_type IN ('profile', 'project') AND v_timeline_owner_id IS NULL THEN
    RAISE EXCEPTION '% timeline requires timeline_owner_id', v_timeline_type;
  END IF;
```

---

### Issue #7: Missing Index on `get_community_timeline` Query ⚠️ MEDIUM

**Location**: `get_community_timeline()` function

**Problem**: Query joins `post_visibility` filtered by `timeline_type = 'community'`, but index is on `(added_at DESC) WHERE timeline_type = 'community'`.

**Current Index**:

```sql
CREATE INDEX idx_post_visibility_timeline_community ON public.post_visibility(added_at DESC)
  WHERE timeline_type = 'community';
```

**Issue**: Doesn't include `post_id` which is needed for the join.

**Better Index**:

```sql
CREATE INDEX idx_post_visibility_community_posts ON public.post_visibility(post_id, added_at DESC)
  WHERE timeline_type = 'community';
```

Or even better, a covering index:

```sql
CREATE INDEX idx_post_visibility_community_covering ON public.post_visibility(added_at DESC, post_id)
  WHERE timeline_type = 'community';
```

---

## ⚠️ WARNINGS (Non-Critical but Should Address)

### Warning #1: Inconsistent Soft Delete Patterns

**Posts table**: Uses `is_deleted` + `deleted_at` + `deletion_reason`
**Comments table**: Uses `is_deleted` + `deleted_at` (no reason)
**Wallet_definitions table**: Uses `is_deleted` + `deleted_at` (no reason)

**Recommendation**: Be consistent. Either all have `deletion_reason` or none do.

---

### Warning #2: No Cascade Prevention on Critical Deletes

**Problem**: `ON DELETE CASCADE` on important relationships might cause unintended data loss.

**Example**:

```sql
post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
```

If someone accidentally deletes a popular post with 1000 comments, ALL comments are deleted immediately. Consider:

- Using soft deletes instead
- Or `ON DELETE SET NULL` + cleanup job
- Or protecting against accidental deletes with RLS

---

### Warning #3: No Rate Limiting on Post Creation

**Problem**: Nothing prevents spam. A user could create 10,000 posts.

**Recommendation**: Add rate limiting:

```sql
CREATE OR REPLACE FUNCTION check_post_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_post_count INT;
BEGIN
  -- Check posts in last hour
  SELECT COUNT(*) INTO recent_post_count
  FROM posts
  WHERE author_id = NEW.author_id
    AND created_at > now() - interval '1 hour'
    AND NOT is_deleted;

  IF recent_post_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 10 posts per hour';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_post_rate_limit_trigger
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION check_post_rate_limit();
```

---

### Warning #4: Missing Created/Updated Timestamps on Some Tables

**Missing on**:

- `post_likes` - has `created_at` only ✅
- `post_comment_likes` - has `created_at` only ✅
- `post_shares` - has `created_at` only ✅

These are fine (no updates expected), but `wallet_ownerships` should have `updated_at`:

```sql
ALTER TABLE wallet_ownerships
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
```

---

### Warning #5: `get_community_timeline` Subquery Performance

**Location**: `get_community_timeline()` uses `array_agg` with subqueries

**Problem**: For posts cross-posted to many timelines, this can be slow.

**Current**:

```sql
array_agg(DISTINCT jsonb_build_object(...))
FILTER (WHERE pv.timeline_type IS NOT NULL AND pv.timeline_type != 'community')
```

**Better**: Limit cross-post display to first 5:

```sql
(
  SELECT jsonb_agg(
    jsonb_build_object(
      'timeline_type', pv2.timeline_type,
      'timeline_owner_id', pv2.timeline_owner_id
    )
  )
  FROM (
    SELECT DISTINCT timeline_type, timeline_owner_id
    FROM post_visibility
    WHERE post_id = p.id
      AND timeline_type != 'community'
    LIMIT 5
  ) pv2
) as cross_posted_to
```

---

## ✅ GOOD PRACTICES OBSERVED

1. **Comprehensive RLS Policies** ✅
   - All tables have RLS enabled
   - Policies cover SELECT, INSERT, UPDATE, DELETE
   - Security-first approach

2. **Soft Deletes** ✅
   - Most tables use `is_deleted` instead of hard deletes
   - Allows data recovery
   - Audit trails preserved

3. **Proper Indexes** ✅
   - Indexes on all foreign keys
   - Partial indexes for common filters
   - GIN indexes for arrays/JSONB

4. **Timestamps** ✅
   - `created_at` and `updated_at` on most tables
   - Triggers to auto-update `updated_at`

5. **Comments and Documentation** ✅
   - Good use of `COMMENT ON TABLE/COLUMN`
   - Clear migration headers

6. **Validation Constraints** ✅
   - CHECK constraints on enums
   - Length limits on text fields
   - NOT NULL where appropriate

---

## 🔧 RECOMMENDED FIXES (Priority Order)

### P0 - Must Fix Before Running

1. **Add referential integrity for polymorphic relationships**
   - Fix `wallet_ownerships.owner_id`
   - Fix `wallet_categories.entity_id`
   - Fix `post_visibility.timeline_owner_id`
   - **Method**: Use trigger-based validation + cleanup

2. **Improve RLS policy validation**
   - Ensure owner_type matches actual entity type
   - Validate permissions correctly

3. **Fix data migration deduplication**
   - Use intelligent deduplication logic
   - Preserve all meaningful data

### P1 - Should Fix Soon

4. **Add missing indexes**
   - Community timeline covering index
   - Optimize join performance

5. **Add validation to `create_post_with_visibility`**
   - Array length matching
   - Timeline type/owner validation

6. **Add rate limiting**
   - Prevent spam
   - Protect database from abuse

### P2 - Nice to Have

7. **Consistent soft delete patterns**
8. **Add `is_active` to wallet_ownerships**
9. **Optimize `get_community_timeline` for many cross-posts**

---

## 📊 Summary

**Total Issues Found**: 7 critical + 5 warnings = 12 issues
**Critical Issues**: 4 (must fix)
**High Priority**: 3 (should fix)
**Medium Priority**: 5 (nice to fix)

**Overall Assessment**: ⚠️ **The migrations are well-designed architecturally, but have critical referential integrity issues that MUST be fixed before running in production.**

**Estimated Fix Time**: 2-4 hours to address all critical issues

**Recommendation**:

1. Fix P0 issues (referential integrity)
2. Test thoroughly with edge cases
3. Then proceed with deployment

---

**Next Steps**: Should I create fixed versions of the migrations addressing these issues?
