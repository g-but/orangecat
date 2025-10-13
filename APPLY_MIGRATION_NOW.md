# 🚀 APPLY PROFILE BACKEND FIX - Quick Guide

## ⚡ Quick Start (3 Steps)

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your **orangecat** project
3. Click **SQL Editor** in left sidebar

### Step 2: Run the Migration
1. Click **"New query"**
2. Copy the entire SQL from: `supabase/migrations/20251013072134_fix_profiles_complete.sql`
3. Paste into SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. Wait for "Success" message

### Step 3: Verify Success
1. Run the verification script: `scripts/db/verify-profile-fix.sql`
2. Look for ✅ checkmarks
3. If all pass, you're done!

---

## 📋 What This Migration Does

- ✅ Removes `full_name` column (uses `display_name` instead)
- ✅ Adds all missing profile columns
- ✅ Fixes `handle_new_user()` trigger for reliable profile creation
- ✅ Updates RLS policies for public profile viewing
- ✅ Adds performance indexes
- ✅ Adds data validation constraints

---

## 🔍 After Migration: Test These

### Test 1: Registration
```bash
# Start your dev server
npm run dev

# Open http://localhost:3000/auth
# Register a new test user
# ✅ Verify: Profile created automatically in database
```

### Test 2: Profile Editing
```bash
# Log in as test user
# Go to profile edit page
# Update: username, display_name, bio, bitcoin address
# Save
# ✅ Verify: Changes persist in database
```

### Test 3: Public Viewing
```bash
# Create second test user
# As User B, visit: /profile/[user-a-username]
# ✅ Verify: Profile is visible and displays correctly
```

---

## 📊 Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check full_name is gone, display_name exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('full_name', 'display_name');
-- Expected: Only 'display_name' appears

-- Check trigger exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
-- Expected: 'handle_new_user' appears

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
-- Expected: 3-4 policies appear

-- Test profile creation (read-only)
SELECT COUNT(*) as profile_count FROM profiles;
-- Expected: Number of existing users
```

---

## ⚠️ If Something Goes Wrong

### Rollback Plan
```sql
-- Restore full_name column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL;

-- Revert code changes
cd /home/g/dev/orangecat
git diff HEAD -- src/ | git apply --reverse
```

### Get Help
1. Check Supabase logs: Dashboard → Logs
2. Check application logs: `npm run dev` output
3. Review: `docs/PROFILE_BACKEND_FIX_SUMMARY.md`

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20251013072134_fix_profiles_complete.sql` | Main migration SQL |
| `scripts/db/verify-profile-fix.sql` | Verification queries |
| `scripts/db/apply-profile-fix.sh` | Interactive helper script |
| `docs/PROFILE_BACKEND_FIX_SUMMARY.md` | Complete documentation |

---

## ✅ Success Checklist

After applying the migration, you should be able to:

- [ ] Register new users successfully
- [ ] See profiles auto-created in database
- [ ] Edit profile fields (username, display_name, bio, bitcoin address)
- [ ] View own profile at `/profile/[username]`
- [ ] View other users' profiles publicly
- [ ] No TypeScript errors in codebase
- [ ] No console errors during registration/profile editing

---

## 🎯 Expected Results

**Before Migration:**
- ❌ Inconsistent schema (`full_name` vs `display_name`)
- ❌ Profile creation may fail silently
- ❌ TypeScript type mismatches
- ❌ Search queries broken

**After Migration:**
- ✅ Consistent `display_name` everywhere
- ✅ Reliable profile auto-creation
- ✅ TypeScript types match database
- ✅ Search works correctly
- ✅ Public profiles viewable by everyone
- ✅ Users can edit their own profiles

---

## 🚨 Important Notes

1. **Safe to Apply**: Uses `IF NOT EXISTS` and `IF EXISTS` - won't break existing data
2. **Data Migration**: Automatically copies `full_name` → `display_name` before dropping
3. **Zero Downtime**: Can apply during normal operation
4. **Backwards Compatible**: Code already updated to use `display_name`
5. **Test First**: Apply to local/staging before production (optional)

---

## 💡 Pro Tips

- **Local Testing**: Run `./scripts/db/apply-profile-fix.sh` and choose option 1
- **Production**: Use Supabase Dashboard SQL Editor (most reliable)
- **Verification**: Always run `verify-profile-fix.sql` after migration
- **Monitoring**: Watch for errors in first few user registrations

---

## 📞 Need Help?

Check these resources:
1. `docs/PROFILE_BACKEND_FIX_SUMMARY.md` - Complete fix documentation
2. `docs/architecture/SUPABASE_SCHEMA_GUIDE.md` - Schema reference
3. Supabase Dashboard → Logs - Real-time error logs
4. Application logs - Check terminal output

---

**Status**: ✅ Migration ready to apply
**Impact**: Low risk - graceful error handling, backwards compatible
**Time**: ~5 seconds to run
**Next**: Apply migration, then test registration flow

---

Last Updated: 2025-10-13


