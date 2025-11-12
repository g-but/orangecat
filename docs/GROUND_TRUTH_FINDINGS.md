# 🔍 GROUND TRUTH DATABASE SCHEMA - Production Reality
**Date**: January 30, 2025
**Status**: CRITICAL FINDINGS

---

## Executive Summary

**The profiles table still has `display_name` - it was never migrated to `name`!**

This is why you're seeing "User cec88bc9" everywhere - the code queries `name` but the database column is `display_name`.

---

## Actual Production Schema

### PROFILES TABLE (50 columns)
```
Columns that exist:
- id
- username
- display_name  ❌ CODE EXPECTS: name
- email
- bio
- avatar_url
- banner_url
- cover_image_url
- website
- bitcoin_address
- lightning_address
- bitcoin_public_key
- lightning_node_id
- bitcoin_balance
- lightning_balance
- payment_preferences
- phone
- location
- timezone
- language
- currency
- follower_count
- following_count
- campaign_count
- profile_views
- total_raised
- total_donated
- verification_status
- verification_level
- verification_data
- kyc_status
- status
- last_active_at
- last_login_at
- login_count
- profile_completed_at
- onboarding_completed
- terms_accepted_at
- privacy_policy_accepted_at
- two_factor_enabled
- social_links
- preferences
- privacy_settings
- metadata
- theme_preferences
- profile_color
- profile_badges
- custom_css
- created_at
- updated_at
```

### PROJECTS TABLE (19 columns)
```
Columns that exist:
- id
- user_id  ✅ (not creator_id)
- title
- description
- category
- tags
- cover_image_url  ✅
- funding_purpose
- goal_amount
- raised_amount  ✅
- currency
- bitcoin_address
- lightning_address
- bitcoin_balance_btc
- bitcoin_balance_updated_at
- status  ✅
- website_url
- created_at
- updated_at
```

**Missing columns:**
- `contributor_count` ❌
- `published` ❌ (using status instead)

---

## 🚨 CRITICAL ISSUES CONFIRMED

### Issue #1: display_name vs name Mismatch
**Severity**: CRITICAL

**Problem**:
- Database has: `display_name`
- Code queries: `name`
- Result: All name queries return NULL

**Evidence**:
```sql
-- This is what the code does:
SELECT name FROM profiles WHERE id = 'xxx'
-- Result: NULL (column doesn't exist)

-- This is what it should do:
SELECT display_name FROM profiles WHERE id = 'xxx'
-- Result: actual name
```

**Impact**:
- Every profile shows "User [id]" instead of actual name
- Profile pages broken
- Creator attribution broken
- Search broken

**Fix Required**:
```sql
-- Option 1: Rename column (RECOMMENDED)
ALTER TABLE profiles RENAME COLUMN display_name TO name;

-- Option 2: Update all code to use display_name (NOT RECOMMENDED)
```

### Issue #2: Missing contributor_count
**Severity**: HIGH

**Problem**: Triggers try to update `contributor_count` but column doesn't exist

**Fix Required**:
```sql
ALTER TABLE projects ADD COLUMN contributor_count INTEGER DEFAULT 0;
```

### Issue #3: Missing published column
**Severity**: LOW

**Problem**: Some code expects `published` boolean, but table uses `status` enum

**Fix**: Use `status = 'active'` instead of `published = true`

---

## 📊 Schema Comparison

| Column | Code Expects | Database Has | Status |
|--------|--------------|--------------|--------|
| profiles.name | ✓ | ❌ | **BROKEN** |
| profiles.display_name | ❌ | ✓ | **UNUSED** |
| projects.user_id | ✓ | ✓ | ✅ OK |
| projects.creator_id | ❌ | ❌ | ✅ OK |
| projects.cover_image_url | ✓ | ✓ | ✅ OK |
| projects.raised_amount | ✓ | ✓ | ✅ OK |
| projects.contributor_count | ✓ | ❌ | **BROKEN** |
| projects.published | ✓ | ❌ | **MINOR** |

---

## ✅ THE FIX

### Migration File: `20250130000000_fix_display_name_and_missing_columns.sql`

```sql
-- =====================================================================
-- FIX #1: Rename display_name to name
-- =====================================================================
-- This fixes ALL the "User cec88bc9" issues
ALTER TABLE profiles RENAME COLUMN display_name TO name;

-- =====================================================================
-- FIX #2: Add missing contributor_count to projects
-- =====================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contributor_count INTEGER DEFAULT 0;

-- Calculate initial values from transactions
UPDATE projects p
SET contributor_count = (
  SELECT COUNT(DISTINCT from_user_id)
  FROM transactions t
  WHERE t.to_project_id = p.id
  AND t.status = 'completed'
);

-- =====================================================================
-- FIX #3: Update trigger to use new contributor_count column
-- =====================================================================
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE projects
    SET
      raised_amount = COALESCE(raised_amount, 0) + NEW.amount_sats,
      contributor_count = (
        SELECT COUNT(DISTINCT from_user_id)
        FROM transactions
        WHERE to_project_id = NEW.to_project_id
        AND status = 'completed'
      )
    WHERE id = NEW.to_project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger if it exists
DROP TRIGGER IF EXISTS transaction_stats ON transactions;
CREATE TRIGGER transaction_stats
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stats();

-- =====================================================================
-- FIX #4: Add indexes for performance
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE status IN ('active', 'draft');
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(to_project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
```

---

## 🎯 IMPACT ASSESSMENT

### Before Fix:
- ❌ All profile names show as "User [id]"
- ❌ Project creators not displayed
- ❌ Search by name broken
- ❌ Contributor count always 0

### After Fix:
- ✅ Profile names display correctly
- ✅ Project creators show real names
- ✅ Search works properly
- ✅ Contributor counts accurate

---

## 🚀 DEPLOYMENT PLAN

### Step 1: Create Migration File
```bash
# Create the migration file
cat > supabase/migrations/20250130000000_fix_display_name_and_missing_columns.sql << 'EOF'
[SQL from above]
EOF
```

### Step 2: Test Locally (if using local Supabase)
```bash
npx supabase db reset
```

### Step 3: Deploy to Production
```bash
npx supabase db push
```

### Step 4: Verify
```bash
# Check that name column exists
curl 'https://ohkueislstxomdjavyhs.supabase.co/rest/v1/profiles?select=name&limit=1'

# Check that contributor_count exists
curl 'https://ohkueislstxomdjavyhs.supabase.co/rest/v1/projects?select=contributor_count&limit=1'
```

---

## ⚠️ ROLLBACK PLAN

If something goes wrong:

```sql
-- Rollback: Rename back to display_name
ALTER TABLE profiles RENAME COLUMN name TO display_name;

-- Rollback: Remove contributor_count
ALTER TABLE projects DROP COLUMN contributor_count;
```

---

## 📝 ADDITIONAL NOTES

### Why This Happened:
1. Someone created migration to rename `display_name` to `name`
2. Migration file exists in repo but never ran on production
3. Code was updated to use `name`
4. Database never actually got the column renamed
5. Result: Mismatch between code and database

### Lesson Learned:
- Always verify migrations actually ran on production
- Check production schema matches code expectations
- Add integration tests that verify schema matches types
- Don't assume migration files = production reality
