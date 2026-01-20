# How to Apply Messaging RLS Fix

**Status:** ✅ Migration file created and ready to apply
**Time Required:** 30 seconds
**File:** `supabase/migrations/20260119000000_fix_messaging_rls_recursion.sql`

---

## What This Migration Fixes

**Problem:** Messaging feature completely broken due to infinite recursion in RLS policies

**Root Cause:** Complex RLS policies in `supabase/migrations/20250102000000_add_conversation_participants_policies.sql` create circular dependencies when querying the `conversations` table

**Solution:** Replace complex policies with simple, non-recursive ones that only check `auth.uid()`

---

## How to Apply (Choose One Method)

### Option A: Supabase CLI (Recommended)

```bash
# 1. Login to Supabase (one-time setup)
supabase login

# 2. Push migration to remote database
supabase db push
```

This will automatically apply all new migrations including the RLS fix.

---

### Option B: Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new
2. Copy the contents of `supabase/migrations/20260119000000_fix_messaging_rls_recursion.sql`
3. Paste into the SQL editor
4. Click "Run"

---

## What the Migration Does

```sql
-- 1. Drops all existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_policy" ON conversation_participants;

-- 2. Creates simple, non-recursive policies
CREATE POLICY "Users can view own conversations"
ON conversation_participants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations"
ON conversation_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participant record"
ON conversation_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave conversations"
ON conversation_participants FOR DELETE
USING (user_id = auth.uid());

-- 3. Verifies all 4 policies were created successfully
```

---

## After Applying

1. **Test messaging works:**
   - Create a conversation
   - Send a message
   - Verify no RLS recursion errors

2. **Verify policies:**
   ```sql
   SELECT policyname, cmd
   FROM pg_policies
   WHERE tablename = 'conversation_participants';
   ```

   Should return 4 rows:
   - `Users can view own conversations` (SELECT)
   - `Users can join conversations` (INSERT)
   - `Users can update own participant record` (UPDATE)
   - `Users can leave conversations` (DELETE)

3. **Commit and deploy:**
   ```bash
   git add supabase/migrations/20260119000000_fix_messaging_rls_recursion.sql
   git commit -m "fix: resolve messaging RLS recursion issue"
   git push origin main
   ```

---

## Troubleshooting

**If migration fails:**
- Check that you have proper database permissions
- Verify you're connected to the correct project (ohkueislstxomdjavyhs)
- Try running the SQL manually in the Supabase dashboard (Option B)

**If messaging still doesn't work after applying:**
- Check browser console for errors
- Verify RLS policies were created (see "Verify policies" above)
- Check Supabase logs for any database errors

---

## Technical Details

**Why the old policies caused recursion:**

The original policies had conditions like:
```sql
conversation_id IN (
  SELECT id FROM conversations WHERE created_by = auth.uid()
)
```

This subquery triggers RLS policies on the `conversations` table, which might reference `conversation_participants`, creating a circular dependency.

**Why the new policies work:**

The new policies only check `auth.uid()` directly without any subqueries, eliminating any possibility of recursion.

---

**Created:** 2026-01-19
**By:** Claude Code (Ralph Loop Session)
**Verified:** ✅ Migration file syntax validated
**Ready to Apply:** ✅ Yes
