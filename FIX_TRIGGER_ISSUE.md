# 🔧 Fix Trigger Permission Issue

## ✅ Issue Fixed

The migration has been updated to **not try to create the trigger** on `auth.users` (protected table).

## 📋 Apply Migration Now (Updated Version)

### Step 1: Apply the Fixed Migration

The migration file has been updated. Now run it in Supabase SQL Editor:

1. Open: https://app.supabase.com → Your Project → SQL Editor
2. Copy contents of: `supabase/migrations/20251013072134_fix_profiles_complete.sql`
3. Paste and click "Run"

**Expected Result:** Should complete successfully now ✅

---

## 🔍 Step 2: Check if Trigger Exists

After the migration completes, run this query:

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  'Trigger exists ✅' as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created' 
  AND tgrelid = 'auth.users'::regclass;
```

**If you get a result:** ✅ Trigger exists - skip to Step 3

**If no results:** ⚠️ Trigger missing - continue to create it

---

## ⚡ Create Missing Trigger (If Needed)

If the trigger doesn't exist, you need to create it with admin permissions.

### Option A: Via Supabase Dashboard (SQL Editor)

Run this SQL as the project owner:

```sql
-- Create the trigger on auth.users
-- This requires admin/owner permissions
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Option B: Via Supabase CLI

```bash
# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the trigger
supabase db push
```

### Option C: Contact Supabase Support

If you still get permission errors:
1. The trigger might require Supabase support to create
2. Or use the Supabase Dashboard → Database → Triggers → Create Trigger UI

---

## ✅ Step 3: Verify Everything Works

### Test Registration

```bash
# Start your app
npm run dev

# Register a new test user
# Open: http://localhost:3000/auth
# Register with: test-user@example.com
```

### Check Profile Was Created

Run in Supabase SQL Editor:

```sql
SELECT 
  id,
  username,
  display_name,
  email,
  created_at
FROM profiles 
WHERE email = 'test-user@example.com';
```

**Expected:** Profile should exist with auto-populated fields ✅

---

## 🎯 Quick Reference

| Status | Next Action |
|--------|-------------|
| ✅ Migration applied, trigger exists | Test registration! |
| ✅ Migration applied, no trigger | Create trigger (see above) |
| ❌ Migration failed | Check error message |

---

## 🚨 If Trigger Creation Still Fails

**Workaround:** Manually create profiles

If you can't create the trigger, profiles can be created manually via API:

```typescript
// In your registration flow
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password
})

if (!authError && authData.user) {
  // Manually create profile
  await supabase.from('profiles').insert({
    id: authData.user.id,
    username: email,
    display_name: email.split('@')[0],
    email: email,
    status: 'active'
  })
}
```

But it's better to have the trigger working for automatic profile creation.

---

## 📊 Verification Checklist

After everything is set up:

- [ ] Migration applied successfully
- [ ] Trigger exists on auth.users
- [ ] New user registration works
- [ ] Profile is auto-created
- [ ] Profile edit works
- [ ] Public profile viewing works

---

**Need Help?** Check the migration output messages - they'll tell you if the trigger exists or not.


