# 🔧 Apply Wallet Migration - Step-by-Step Guide

## Issue: Database Connection Failed

The automated migration script failed because the Supabase credentials in this environment are not working properly:

- Connection error: "Tenant or user not found"
- API key error: "Invalid API key"

**You need to apply the migration manually using one of the methods below.**

---

## ✅ Method 1: Supabase Dashboard (RECOMMENDED - Easiest)

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Log in to your account
   - Select project: `ohkueislstxomdjavyhs`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open this file: `supabase/migrations/20251112000000_create_wallets_system_fixed.sql`
   - Copy ALL contents (entire file)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for execution (should take 2-5 seconds)

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - Run this query to verify:
     ```sql
     SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name = 'wallets';
     ```
   - Should return: `wallets`

---

## ✅ Method 2: Using psql from Your Local Machine

If you have PostgreSQL client installed on your machine:

### Steps:

1. **Get Connection String**
   - Supabase Dashboard → Settings → Database
   - Copy "Connection string" under "Connection parameters"
   - Should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.ohkueislstxomdjavyhs.supabase.co:5432/postgres`

2. **Run Migration**

   ```bash
   cd /path/to/orangecat

   psql "postgresql://postgres:[YOUR-PASSWORD]@db.ohkueislstxomdjavyhs.supabase.co:5432/postgres" \
     -f supabase/migrations/20251112000000_create_wallets_system_fixed.sql
   ```

3. **Verify**
   ```bash
   psql "your-connection-string" -c "\d public.wallets"
   ```

---

## ✅ Method 3: Using Supabase CLI

If you have Supabase CLI installed:

### Steps:

1. **Link Project**

   ```bash
   cd /path/to/orangecat
   supabase link --project-ref ohkueislstxomdjavyhs
   ```

2. **Run Migration**

   ```bash
   supabase db push
   ```

   Or manually:

   ```bash
   supabase db execute --file supabase/migrations/20251112000000_create_wallets_system_fixed.sql
   ```

---

## 🔍 What the Migration Does

The migration creates:

### 1. `wallets` Table

- Stores multiple Bitcoin wallets per profile/project
- Columns: id, profile_id, project_id, user_id, label, description, address_or_xpub, wallet_type, category, category_icon, goal_amount, goal_currency, balance_btc, etc.

### 2. Database Functions

- `set_wallet_user_id()` - Auto-sets user_id from profile/project
- `check_wallet_limit()` - Enforces 10-wallet limit
- `update_wallet_timestamp()` - Auto-updates timestamps

### 3. Triggers

- `wallet_user_id_trigger` - Calls set_wallet_user_id()
- `wallet_limit_trigger` - Calls check_wallet_limit()
- `wallet_timestamp_trigger` - Calls update_wallet_timestamp()

### 4. Indexes

- `idx_wallets_profile` - Fast profile queries
- `idx_wallets_project` - Fast project queries
- `idx_wallets_user` - Fast user queries
- `idx_wallets_address` - Fast address lookups

### 5. RLS Policies

- `wallets_select_policy` - Anyone can read active wallets
- `wallets_insert_policy` - Only owners can create
- `wallets_update_policy` - Only owners can update
- `wallets_delete_policy` - Only owners can delete

---

## ✅ How to Verify Migration Success

After running the migration, verify it worked:

### Test 1: Check Table Exists

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'wallets';
```

**Expected:** Returns `wallets`

### Test 2: Check Columns

```sql
\d public.wallets
```

**Expected:** Shows all wallet columns (id, profile_id, label, etc.)

### Test 3: Check Triggers

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'wallets';
```

**Expected:** Shows 3 triggers (user_id, limit, timestamp)

### Test 4: Check RLS Policies

```sql
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'wallets';
```

**Expected:** Shows 4 policies (select, insert, update, delete)

### Test 5: Try Creating a Wallet (from app)

1. Log in to OrangeCat
2. Go to your profile → Edit Profile
3. Scroll to "Bitcoin Wallets"
4. Click "+ Add Wallet"
5. Fill form and save

**Expected:** Wallet created successfully

---

## 🆘 Troubleshooting

### Error: "relation 'wallets' already exists"

- Migration already applied
- Skip to verification tests

### Error: "permission denied"

- Make sure you're using service_role or postgres user
- Check RLS is not blocking admin operations

### Error: "function does not exist"

- Check if triggers were created
- Re-run migration (it's idempotent with IF NOT EXISTS)

### Still Not Working?

1. Check Supabase project is active
2. Verify database connection in Supabase Dashboard
3. Check API keys are correct in .env.local
4. Try creating wallet via API directly:
   ```bash
   curl -X POST 'https://ohkueislstxomdjavyhs.supabase.co/rest/v1/wallets' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "profile_id": "YOUR_PROFILE_ID",
       "label": "Test Wallet",
       "address_or_xpub": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
       "wallet_type": "address",
       "category": "general"
     }'
   ```

---

## 📝 After Migration is Applied

Once the migration succeeds:

1. ✅ Wallet system is FULLY FUNCTIONAL
2. ✅ Users can add/edit/delete wallets from profile editor
3. ✅ Wallets display on public profiles
4. ✅ All API endpoints work

Test the full workflow:

1. Add wallet → See it in edit mode
2. View public profile → See wallet card
3. Refresh balance → Updates from blockchain
4. Edit wallet → Changes saved
5. Delete wallet → Removed

---

## 🎉 Next Steps After Migration

1. **Test the System** (10 minutes)
   - Add a wallet with category
   - View it on public profile
   - Test all CRUD operations

2. **Optional: Migrate Legacy Addresses**
   - If you have existing bitcoin_address fields
   - See `WALLET_INTEGRATION_PLAN.md` → Step 4

3. **Optional: Add to Projects**
   - Same pattern as profiles
   - See `WALLET_INTEGRATION_PLAN.md` → Step 3

---

## 📧 Support

If you encounter issues:

1. Check Supabase Dashboard → Database → Tables
2. Check browser console for API errors
3. Review migration file: `supabase/migrations/20251112000000_create_wallets_system_fixed.sql`
4. Check logs in Supabase Dashboard → Logs

**The code is ready - just need the database schema!** 🚀
