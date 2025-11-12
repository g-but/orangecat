# Manual Testing Guide: Public Profiles & Sharing

**Created:** 2025-01-30  
**Last Modified:** 2025-01-30  
**Last Modified Summary:** Manual testing checklist for Phase 1 implementation

## 🎯 Testing Overview

This guide helps you manually test the public profiles and sharing functionality before deployment.

---

## ✅ Pre-Testing Checklist

Before starting, ensure:

- [ ] Development server is running (`npm run dev`)
- [ ] You have at least one user with a username in the database
- [ ] You have at least one public project (status != 'draft')
- [ ] Browser dev tools are open (F12)

---

## 📋 Test 1: Public Profile Route

### Test Case 1.1: Access Existing Profile

**Steps:**

1. Find a username from your database (e.g., `testuser`)
2. Navigate to: `http://localhost:3000/profiles/[username]`
3. Replace `[username]` with actual username

**Expected Results:**

- ✅ Profile page loads without errors
- ✅ Profile information displays (name, bio, avatar if available)
- ✅ Projects section shows user's public projects
- ✅ Statistics display (project count, total raised)
- ✅ No "Loading..." flash
- ✅ Page title in browser tab shows profile name

**Check Browser Dev Tools:**

- Open Network tab → Reload page
- Look for initial HTML response (should contain profile data)
- Check Elements tab → Look for `<meta>` tags in `<head>`

---

### Test Case 1.2: Profile Metadata Tags

**Steps:**

1. Navigate to a public profile page
2. View page source (Right-click → View Page Source)

**Expected Results:**

- ✅ `<meta property="og:title">` contains profile name
- ✅ `<meta property="og:description">` contains bio or default description
- ✅ `<meta property="og:type">` is "profile"
- ✅ `<meta property="og:url">` contains correct URL
- ✅ `<meta name="twitter:card">` is "summary"
- ✅ `<title>` tag contains profile name

**Verify:**

```html
<meta property="og:title" content="[Profile Name] on OrangeCat" />
<meta property="og:type" content="profile" />
<meta property="og:url" content="https://orangecat.ch/profiles/[username]" />
```

---

### Test Case 1.3: Non-Existent Profile (404)

**Steps:**

1. Navigate to: `http://localhost:3000/profiles/definitely-does-not-exist-12345`

**Expected Results:**

- ✅ 404 page displays
- ✅ Shows "Profile Not Found" message
- ✅ Has "Go Home" and "Discover Projects" buttons
- ✅ No errors in console

---

## 📋 Test 2: Project Page Server-Side Rendering

### Test Case 2.1: Project Page Loads Instantly

**Steps:**

1. Find a project ID from your database
2. Navigate to: `http://localhost:3000/projects/[id]`
3. Watch the initial page load

**Expected Results:**

- ✅ Page loads instantly (no "Loading..." flash)
- ✅ Project content appears immediately
- ✅ All project information displays correctly
- ✅ Gallery, sidebar, and content sections render

**Check Browser Dev Tools:**

- Open Network tab → Reload page
- Initial HTML response should contain project data
- No client-side fetch for project data (it's server-rendered)

---

### Test Case 2.2: Project Metadata Tags

**Steps:**

1. Navigate to a project page
2. View page source (Right-click → View Page Source)

**Expected Results:**

- ✅ `<meta property="og:title">` contains project title
- ✅ `<meta property="og:description">` contains project description
- ✅ `<meta property="og:type">` is "website"
- ✅ `<meta property="og:url">` contains correct project URL
- ✅ `<meta name="twitter:card">` is "summary_large_image"
- ✅ `<title>` tag contains project title

**Verify:**

```html
<meta property="og:title" content="[Project Title]" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://orangecat.ch/projects/[id]" />
<meta name="twitter:card" content="summary_large_image" />
```

---

### Test Case 2.3: Project Page Interactivity

**Steps:**

1. Navigate to a project page
2. Test interactive features

**Expected Results:**

- ✅ Share button opens share dialog
- ✅ Gallery displays images (if any)
- ✅ Sidebar shows project summary
- ✅ All buttons and links work
- ✅ Back button navigates correctly

---

### Test Case 2.4: Non-Existent Project (404)

**Steps:**

1. Navigate to: `http://localhost:3000/projects/00000000-0000-0000-0000-000000000000`

**Expected Results:**

- ✅ 404 page displays
- ✅ Shows "Project Not Found" message
- ✅ Has "Go Home" and "Browse Projects" buttons
- ✅ No errors in console

---

## 📋 Test 3: Social Media Preview Cards

### Test Case 3.1: Twitter Card Validator

**Steps:**

1. Navigate to a project page
2. Copy the full URL
3. Go to: https://cards-dev.twitter.com/validator
4. Paste the URL and click "Preview card"

**Expected Results:**

- ✅ Card preview appears
- ✅ Shows project title
- ✅ Shows project description
- ✅ Shows image (if available)
- ✅ Card type is "summary_large_image"

**Note:** For localhost, Twitter validator may not work. Test with production URL after deployment.

---

### Test Case 3.2: Facebook Debugger

**Steps:**

1. Navigate to a project page
2. Copy the full URL
3. Go to: https://developers.facebook.com/tools/debug/
4. Paste the URL and click "Debug"

**Expected Results:**

- ✅ Shows Open Graph tags
- ✅ Displays preview card
- ✅ Shows correct title, description, image
- ✅ URL is correct

**Note:** For localhost, use production URL or ngrok tunnel.

---

### Test Case 3.3: LinkedIn Post Inspector

**Steps:**

1. Navigate to a project page
2. Copy the full URL
3. Go to: https://www.linkedin.com/post-inspector/
4. Paste the URL and click "Inspect"

**Expected Results:**

- ✅ Shows preview card
- ✅ Displays correct metadata
- ✅ Image appears (if available)

---

## 📋 Test 4: Route Constants

### Test Case 4.1: Profile Links Use Correct Route

**Steps:**

1. Check any component that links to profiles
2. Verify it uses `ROUTES.PROFILES.VIEW(username)`

**Expected Results:**

- ✅ Links use `/profiles/[username]` format
- ✅ No hardcoded `/profile/` routes for public profiles

---

## 📋 Test 5: Edge Cases

### Test Case 5.1: Profile Without Projects

**Steps:**

1. Find or create a user with no projects
2. Navigate to their public profile

**Expected Results:**

- ✅ Profile displays correctly
- ✅ Shows "This person hasn't created any public projects yet"
- ✅ No errors in console

---

### Test Case 5.2: Profile Without Username

**Steps:**

1. Find a user without a username (username is null)
2. Try to access `/profiles/null` or similar

**Expected Results:**

- ✅ 404 page displays
- ✅ No errors in console

---

### Test Case 5.3: Project Without Creator Profile

**Steps:**

1. Find a project where creator profile doesn't exist
2. Navigate to the project page

**Expected Results:**

- ✅ Project page still loads
- ✅ Project information displays
- ✅ No errors related to missing profile
- ✅ Metadata still generates correctly

---

## 🐛 Common Issues & Solutions

### Issue: "Loading..." still appears

**Solution:** Check that the page is using Server Component, not Client Component. Verify `'use client'` is not at the top of `page.tsx`.

### Issue: Metadata tags missing

**Solution:** Verify `generateMetadata` function is exported and returns proper Metadata object.

### Issue: 404 not working

**Solution:** Check that `not-found.tsx` exists in the route directory.

### Issue: Type errors

**Solution:** Verify Profile type matches what's expected. Check type conversions in PublicProfileClient.

---

## ✅ Test Completion Checklist

- [ ] All test cases pass
- [ ] No console errors
- [ ] Metadata tags present in HTML
- [ ] Social media previews work (on production)
- [ ] 404 pages display correctly
- [ ] Route constants used correctly
- [ ] Edge cases handled gracefully

---

## 🚀 Next Steps After Testing

1. **Fix any issues** found during testing
2. **Run automated test script:** `node scripts/test/public-profiles-sharing-test.js`
3. **Deploy to staging** and test with real URLs
4. **Test social media previews** with production URLs
5. **Deploy to production** once all tests pass

---

## 📝 Test Results Template

```
Test Date: [DATE]
Tester: [NAME]
Environment: [local/staging/production]

Test Results:
- Public Profile Route: ✅ / ❌
- Project Page SSR: ✅ / ❌
- Metadata Tags: ✅ / ❌
- Social Media Previews: ✅ / ❌
- 404 Handling: ✅ / ❌

Issues Found:
- [List any issues]

Notes:
- [Any additional notes]
```

---

**Status:** Ready for manual testing
