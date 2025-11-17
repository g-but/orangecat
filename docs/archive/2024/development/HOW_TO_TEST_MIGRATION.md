# How to Test the Supabase Migration

**Date:** 2025-10-23
**Purpose:** Step-by-step guide for manually testing the migration
**Time Required:** ~15-30 minutes

---

## Quick Start

```bash
# 1. Start the dev server
npm run dev

# 2. Open browser to http://localhost:3000

# 3. Open browser console (F12)

# 4. Follow the test steps below
```

---

## Test 1: Check for Deprecation Warnings ⚠️

**What to expect:** You should see deprecation warnings in the browser console (this is normal and expected).

**Steps:**

1. Open browser console (F12)
2. Look for yellow warning messages
3. You should see warnings like:
   ```
   ⚠️ DEPRECATED: @/services/supabase/client is deprecated.
   Use @/lib/supabase/browser instead.
   ```

**Expected Result:**

- ⚠️ Deprecation warnings appear (GOOD - shows old files are still loaded)
- ❌ No red errors should appear

**If you see errors:**

- Copy the error message
- Check which file is causing it
- Report the error

---

## Test 2: Authentication - Sign Up ✅

**Steps:**

1. Go to http://localhost:3000
2. Click "Sign Up" or navigate to sign-up page
3. Fill in:
   - Email: `test-migration-{timestamp}@example.com`
   - Password: `TestPassword123!`
4. Click "Sign Up"

**Expected Result:**

- ✅ Sign-up succeeds
- ✅ Email confirmation sent (check logs)
- ✅ No console errors
- ✅ Redirected to appropriate page

**If it fails:**

- Check browser console for errors
- Check terminal for server errors
- Note: Email might not send in dev mode (that's OK)

---

## Test 3: Authentication - Sign In ✅

**Steps:**

1. If you have an existing test account, use it
2. Otherwise, use:
   - Email: Your test email
   - Password: Your test password
3. Click "Sign In"

**Expected Result:**

- ✅ Sign-in succeeds
- ✅ User session created
- ✅ Redirected to dashboard/home
- ✅ No console errors

**Check Session:**
Open browser console and run:

```javascript
// Get current session
const session = await supabase.auth.getSession();
console.log('Session:', session.data.session ? 'Active' : 'None');
```

---

## Test 4: Profile Operations 👤

**Steps:**

1. Make sure you're signed in
2. Navigate to profile page (usually `/settings` or `/profile`)
3. Try to edit your profile:
   - Change display name
   - Update bio
   - Upload avatar (optional)
4. Click "Save"

**Expected Result:**

- ✅ Profile loads correctly
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ No console errors

**Verify in Console:**

```javascript
// Check if profile data loaded
console.log('Profile loaded:', document.querySelector('[data-profile]') ? 'Yes' : 'No');
```

---

## Test 5: Database Operations 📊

**Test Read Operation:**

1. Navigate to any page that shows data (e.g., projects, campaigns)
2. Check if data loads

**Expected Result:**

- ✅ Data loads successfully
- ✅ No "loading forever" state
- ✅ No console errors

**Test Write Operation:**

1. Try to create a new item (project, campaign, etc.)
2. Fill in the form
3. Submit

**Expected Result:**

- ✅ Item creates successfully
- ✅ Shows in list
- ✅ No console errors

---

## Test 6: Sign Out 🚪

**Steps:**

1. Click "Sign Out" button (usually in header or settings)
2. Wait for sign out to complete

**Expected Result:**

- ✅ Signs out successfully
- ✅ Redirected to home/login page
- ✅ Session cleared
- ✅ No console errors

**Verify in Console:**

```javascript
// Check session is cleared
const session = await supabase.auth.getSession();
console.log('Session after logout:', session.data.session ? 'ERROR: Still active' : 'OK: Cleared');
```

---

## Test 7: Page Refresh (Session Persistence) 🔄

**Steps:**

1. Sign in again
2. Wait for page to fully load
3. Press F5 (refresh page)
4. Wait for page to reload

**Expected Result:**

- ✅ Still signed in after refresh
- ✅ No need to sign in again
- ✅ Session persisted correctly
- ✅ No console errors

---

## Test 8: Check Storage (Advanced) 💾

**Steps:**

1. Open browser console (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Look at Local Storage and Session Storage
4. Find entries with "supabase" in the name

**Expected Result:**

- ✅ Supabase auth data present
- ✅ Session token stored
- ✅ Storage entries look valid (JSON format)

**Verify Storage in Console:**

```javascript
// Check what's in storage
console.log('LocalStorage:', localStorage.getItem('sb-project-auth-token'));
console.log('SessionStorage:', sessionStorage.getItem('sb-project-auth-token'));
```

---

## Test 9: API Routes (Server Client) 🔌

**Steps:**

1. Open browser console
2. Make a direct API call:

```javascript
// Test API route
fetch('/api/profile')
  .then(r => r.json())
  .then(data => console.log('API Response:', data));
```

**Expected Result:**

- ✅ API responds successfully
- ✅ Returns valid JSON
- ✅ No 500 errors
- ✅ Proper authentication check

---

## Test 10: Error Handling 🛡️

**Test Invalid Credentials:**

1. Try to sign in with wrong password
2. Observe error message

**Expected Result:**

- ✅ Shows clear error message
- ✅ No console errors (errors should be handled)
- ✅ User can try again

**Test Network Error:**

1. Open browser DevTools
2. Go to Network tab
3. Enable "Offline" mode
4. Try to perform an action

**Expected Result:**

- ✅ Shows appropriate error message
- ✅ Graceful degradation
- ✅ No crashes

---

## Quick Test Checklist ✅

Use this for a fast verification:

**Basic Flow (5 minutes):**

- [ ] Start dev server
- [ ] Open browser
- [ ] Check console for warnings (should see deprecation warnings)
- [ ] Sign in
- [ ] View profile
- [ ] Sign out

**Full Flow (15 minutes):**

- [ ] All basic flow tests
- [ ] Create new item
- [ ] Edit item
- [ ] Test refresh (session persistence)
- [ ] Test error handling

**Comprehensive Flow (30 minutes):**

- [ ] All full flow tests
- [ ] Test all auth flows (sign up, password reset)
- [ ] Test all CRUD operations
- [ ] Test API routes directly
- [ ] Test offline handling

---

## What to Look For

### ✅ Good Signs

- Deprecation warnings in console (expected)
- All features work as before
- No red errors in console
- No 500 errors in Network tab
- Session persists across refresh

### 🚨 Bad Signs (Report These)

- Red errors in console
- Features broken that worked before
- Authentication fails
- 500 errors in Network tab
- "Cannot read property of undefined"
- TypeScript errors in browser

---

## Reporting Issues

If you find any issues, report them with:

1. **What you were doing:**
   - Example: "Trying to sign in with test@example.com"

2. **What happened:**
   - Example: "Got error: Cannot read property 'user' of undefined"

3. **Browser console error:**
   - Copy the full error message

4. **Steps to reproduce:**
   - List exact steps to trigger the issue

5. **Browser info:**
   - Chrome 120, Firefox 121, etc.

---

## Performance Check

While testing, also note:

**Page Load Time:**

- Should be same as before (or better)
- No noticeable slowdown

**Auth Operations:**

- Sign in: Should be fast (< 2 seconds)
- Sign out: Should be instant

**Database Queries:**

- Data should load quickly
- No "loading forever" states

---

## Common Issues & Solutions

### Issue: "supabase is not defined"

**Solution:** Check that the import is correct in the file causing the error

### Issue: Deprecation warnings everywhere

**Solution:** This is expected! Old files still work and show warnings

### Issue: Auth not working

**Solution:** Check environment variables in `.env.local`

### Issue: 500 errors on API routes

**Solution:** Check terminal for server errors, may need to restart dev server

---

## Success Criteria

**Minimum Success (Required):**

- ✅ Can sign in and out
- ✅ Can view profile
- ✅ No blocking errors

**Full Success (Ideal):**

- ✅ All auth flows work
- ✅ All CRUD operations work
- ✅ Session persists
- ✅ Error handling works
- ✅ Performance is good

---

## Next Steps After Testing

**If all tests pass:**

1. Update this document with ✅ checkmarks
2. Proceed to staging deployment (if applicable)
3. Schedule legacy file removal (after 1-2 weeks)

**If issues found:**

1. Document the issues
2. Determine if they're blocking
3. Fix issues or rollback if critical
4. Re-test after fixes

---

## Quick Commands

```bash
# Start testing
npm run dev

# If you need to restart
pkill -f "next dev"
npm run dev

# Check for TypeScript errors
npm run type-check

# Run tests (if available)
npm test
```

---

**Testing Guide Version:** 1.0
**Last Updated:** 2025-10-23
**Status:** Ready for Use
