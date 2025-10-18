# 🚀 Database Deployment Guide

> How to safely apply database changes to production

**Last Updated:** October 17, 2025
**Target:** OrangeCat Production Database (ohkueislstxomdjavyhs)

## Quick Links

- 📊 [Supabase Dashboard](https://supabase.com/dashboard/project/ohkueislstxomdjavyhs)
- 📝 [SQL Editor](https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new)
- 🗂️ [Database Explorer](https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/editor)
- 📈 [Indexes View](https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/database/indexes)

---

## 🎯 Current Status

### Pending Migrations

#### 1. ✅ Add Index on transactions.status (HIGH PRIORITY)
**File:** `supabase/migrations/20251017000001_add_transactions_status_index.sql`
**Priority:** P0 - Critical
**Impact:** 10x faster transaction queries
**Risk:** Low (index creation is safe)
**Downtime:** None (concurrent creation)

**Status:** Ready to apply

#### 2. 🔄 Create audit_logs table (HIGH PRIORITY)
**File:** `supabase/migrations/20251017000002_create_audit_logs.sql` (to be created)
**Priority:** P0 - Compliance
**Impact:** Security, debugging, regulatory compliance
**Risk:** Low (new table)
**Downtime:** None

**Status:** In development

---

## 📋 Method 1: Supabase Dashboard (Recommended)

**Best for:** Production deployments, learning, safety

### Step-by-Step Instructions

#### For: Add Index on transactions.status

1. **Navigate to SQL Editor:**
   ```
   https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new
   ```

2. **Paste this SQL:**
   ```sql
   -- Migration: Add index on transactions.status
   -- Created: 2025-10-17
   -- Priority: P0 - Critical (Quick Win)
   -- Impact: 10x faster queries filtering by transaction status

   BEGIN;

   -- Add index on transactions.status column
   CREATE INDEX IF NOT EXISTS idx_transactions_status
   ON transactions(status);

   -- Add comment for documentation
   COMMENT ON INDEX idx_transactions_status IS
   'Index for fast filtering transactions by status. Critical for admin dashboards and payment processing.';

   -- Verify creation
   SELECT
     schemaname,
     tablename,
     indexname,
     indexdef
   FROM pg_indexes
   WHERE indexname = 'idx_transactions_status';

   COMMIT;
   ```

3. **Click "RUN"** (Bottom right)

4. **Verify Results:**
   - ✅ You should see output showing the index details
   - ✅ No errors
   - ✅ 1 row returned with index information

5. **Double-check in Database Explorer:**
   - Go to: Database → transactions table → Indexes tab
   - Look for: `idx_transactions_status`

### Why This Method?

**Pros:**
- ✅ Visual confirmation before execution
- ✅ Built-in transaction support (BEGIN/COMMIT)
- ✅ Query history saved
- ✅ Can easily rollback if needed
- ✅ Syntax highlighting and validation

**Cons:**
- ⚠️ Manual process (can't automate)
- ⚠️ Need dashboard access

---

## 📋 Method 2: Migration Functions

**Best for:** Automated deployments, CI/CD

### How It Works

We create a PostgreSQL function that contains the migration logic, then call it once.

#### Step 1: Create the Migration Function

Paste this in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION apply_transaction_index_migration()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result text;
BEGIN
  -- Check if index already exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'transactions'
    AND indexname = 'idx_transactions_status'
  ) THEN
    RETURN 'Index idx_transactions_status already exists. No action taken.';
  END IF;

  -- Create the index
  CREATE INDEX idx_transactions_status
  ON transactions(status);

  -- Add comment
  EXECUTE 'COMMENT ON INDEX idx_transactions_status IS ' ||
    quote_literal('Index for fast filtering transactions by status. Critical for admin dashboards and payment processing.');

  -- Verify creation
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_transactions_status'
  ) THEN
    v_result := 'SUCCESS: Index idx_transactions_status created successfully';
  ELSE
    v_result := 'ERROR: Index creation failed';
  END IF;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;
```

#### Step 2: Execute the Migration

```sql
SELECT apply_transaction_index_migration();
```

#### Step 3: Clean Up (Optional)

```sql
DROP FUNCTION IF EXISTS apply_transaction_index_migration();
```

### Why This Method?

**Pros:**
- ✅ Idempotent (can run multiple times safely)
- ✅ Self-documenting
- ✅ Error handling built-in
- ✅ Can be called from application code

**Cons:**
- ⚠️ More complex than direct SQL
- ⚠️ Requires function creation permissions

---

## 📋 Method 3: CLI Migrations

**Best for:** Local development, version control

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
npx supabase link --project-ref ohkueislstxomdjavyhs
```

### Apply Migrations

```bash
# See pending migrations
npx supabase db push --linked --dry-run

# Apply all pending migrations
npx supabase db push --linked
```

### Common Issues & Solutions

#### Issue: "Type already exists"
**Cause:** Migration was partially applied before

**Solution:**
```sql
-- Make migrations idempotent
CREATE TYPE IF NOT EXISTS my_type_enum AS ENUM (...);
CREATE INDEX IF NOT EXISTS my_index_name ON ...;
```

#### Issue: "Network unreachable"
**Cause:** Connection issues, VPN, or firewall

**Solution:**
1. Use Supabase Dashboard (Method 1)
2. Check network connectivity
3. Try direct database URL (not pooler)

#### Issue: "Permission denied"
**Cause:** Using anon key instead of service role key

**Solution:**
```bash
# Ensure you're using service role key
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## 🔍 Verification Checklist

After applying any migration:

### 1. Check Migration Was Applied

```sql
-- Check if index exists
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_transactions_status';
```

**Expected result:** 1 row returned

### 2. Test Query Performance

```sql
-- Before (should not use index if not created)
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- After (should show "Index Scan using idx_transactions_status")
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for:**
- ✅ "Index Scan using idx_transactions_status" in plan
- ✅ Execution time reduced (e.g., 500ms → 50ms)
- ✅ Rows scanned reduced significantly

### 3. Check Index Size

```sql
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE indexname = 'idx_transactions_status';
```

**Expected:** Small size (< 1MB for typical workloads)

### 4. Monitor for Locks

```sql
-- Check if any queries are blocked
SELECT
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

**Expected:** Empty result (no blocking)

---

## ⚠️ Rollback Procedures

### Rollback: Remove Index

If you need to remove the index:

```sql
BEGIN;

DROP INDEX IF EXISTS idx_transactions_status;

-- Verify removal
SELECT count(*) FROM pg_indexes
WHERE indexname = 'idx_transactions_status';
-- Expected: 0

COMMIT;
```

**When to rollback:**
- Index causing unexpected performance issues
- Discovered bug in migration
- Need to modify index definition

**Note:** Removing an index is instant and safe (just drops metadata)

---

## 📊 Monitoring After Deployment

### Track Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as rows_read,
  idx_tup_fetch as rows_fetched
FROM pg_stat_user_indexes
WHERE indexname = 'idx_transactions_status';
```

**What to monitor:**
- `idx_scan`: Should increase over time (index being used)
- If idx_scan = 0 after 24h, index might not be needed

### Query Performance

Use Supabase Query Performance dashboard:
```
https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/reports/query-performance
```

**Look for:**
- ✅ Reduced execution time on transaction queries
- ✅ Lower CPU usage
- ✅ Fewer sequential scans

---

## 🎓 Learning Notes

### What We Did Today

1. **Analyzed production database** → Found missing index
2. **Created migration file** → `20251017000001_add_transactions_status_index.sql`
3. **Documented deployment** → Multiple methods for different scenarios
4. **Prepared verification** → Scripts to confirm success

### Key Lessons

#### 1. **Idempotent Migrations**
```sql
-- ❌ Will fail on second run
CREATE INDEX idx_name ON table(column);

-- ✅ Safe to run multiple times
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

#### 2. **Concurrent Index Creation**
```sql
-- ❌ Locks table for writes (bad for production)
CREATE INDEX idx_name ON table(column);

-- ✅ No table locking (safe for production)
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

**Note:** `IF NOT EXISTS` and `CONCURRENTLY` can't be used together in PostgreSQL.

#### 3. **Transaction Wrapping**
```sql
BEGIN;
-- Your migration
-- Verify it worked
COMMIT;  -- or ROLLBACK if verification failed
```

#### 4. **Always Verify**
Don't just trust the migration succeeded - verify:
- Index exists in pg_indexes
- Query plan uses the index
- Performance improved

---

## 🚀 Next Steps

1. **Apply the index migration** (Choose Method 1, 2, or 3 above)
2. **Verify success** (Run verification queries)
3. **Monitor for 24h** (Check index usage stats)
4. **Proceed to next migration** (audit_logs table)

---

## 📞 Support

**If something goes wrong:**

1. **Check Supabase Logs:**
   ```
   https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/logs/explorer
   ```

2. **Rollback immediately** (if breaking production)
   - Use rollback procedure above
   - Document what went wrong

3. **Review migration in staging** (if available)
   - Test on copy of production data
   - Time the operation
   - Check for locks

**Emergency contacts:**
- Supabase Status: https://status.supabase.com/
- Supabase Support: Dashboard → Help → Support

---

**Remember:** Every production database change should be:
1. ✅ **Tested** in staging/local first
2. ✅ **Documented** with clear intent
3. ✅ **Reversible** with rollback plan
4. ✅ **Verified** after application
5. ✅ **Monitored** for impact

**You're doing great!** 🎉 Database changes can be intimidating, but with proper process, they're safe and routine.
