# 🖱️ OrangeCat Browser Testing Script

## 🎯 MANUAL BROWSER TESTING - Step by Step

**Time Estimate**: 45-60 minutes
**Browser**: Chrome/Firefox recommended
**Prerequisites**: `npm run dev` running on http://localhost:3000

---

## 🚀 PHASE 1: SETUP & AUTHENTICATION (5 minutes)

### **Step 1: Start the Application**
```bash
cd /home/g/dev/orangecat
npm run dev
```
**Expected**: App starts on http://localhost:3000

### **Step 2: Verify Database**
Open terminal and run:
```bash
node scripts/db-verify-fixes.mjs
```
**Expected**: ✅ 100% success rate

### **Step 3: Homepage Check**
1. Open browser to `http://localhost:3000`
2. Verify page loads without errors
3. Check navigation menu (Home, Discover, About, etc.)
4. Look for "Get Started Today" or login buttons

**Expected Results**:
- ✅ Page loads < 2 seconds
- ✅ No console errors
- ✅ Responsive design
- ✅ Navigation works

---

## 🔐 PHASE 2: USER REGISTRATION & LOGIN (5 minutes)

### **Test User 1: Project Creator**
1. Click "Get Started Today" or "Sign Up"
2. Fill registration form:
   - **Email**: `creator@test.orangecat`
   - **Password**: `TestPassword123!`
   - **Username**: `project_creator`
   - **Name**: `Alex Chen`
3. Click "Create Account"
4. Check email for confirmation (or skip if disabled)
5. Login with credentials

**Expected Results**:
- ✅ Registration successful
- ✅ Redirected to dashboard
- ✅ Profile auto-created
- ✅ Sidebar navigation visible

### **Test User 2: Service Provider**
1. Logout (user menu → Logout)
2. Click "Sign Up" again
3. Fill registration form:
   - **Email**: `provider@test.orangecat`
   - **Password**: `TestPassword123!`
   - **Username**: `service_provider`
   - **Name**: `Maria Garcia`
4. Complete registration and login

**Expected Results**:
- ✅ Second user created successfully
- ✅ No conflicts with first user
- ✅ Clean login/logout flow

---

## 🎯 PHASE 3: PROJECT CREATION & MANAGEMENT (10 minutes)

### **Step 1: Create Community Garden Project**
1. Login as `project_creator`
2. Go to `http://localhost:3000/dashboard` (should auto-redirect)
3. Click "Create Project" or go to `http://localhost:3000/projects/create`
4. Select "Community Garden" template
5. Fill project details:
   - **Title**: `Urban Community Garden Initiative`
   - **Description**: `Transforming abandoned city lots into thriving community gardens. Teaching sustainable agriculture and building neighborhood connections.`
   - **Funding Goal**: `250000` (sats)
   - **Bitcoin Address**: `bc1qcommunitygarden123456789`
   - **Category**: `Community`
   - **Tags**: `environment`, `sustainability`, `education`, `local`
6. Upload cover image (optional - skip if no image)
7. Click "Create Project"

**Expected Results**:
- ✅ Project created successfully
- ✅ Redirect to project page
- ✅ Project shows in dashboard (`http://localhost:3000/dashboard/projects`)
- ✅ Public project page loads (`/projects/{id}`)

### **Step 2: Edit Project**
1. From project page, click "Edit Project"
2. Change description
3. Update funding goal to `300000` sats
4. Add more tags: `urban`, `farming`
5. Save changes

**Expected Results**:
- ✅ Changes saved
- ✅ Project page updated
- ✅ No data loss

### **Step 3: Project Discovery**
1. Go to `http://localhost:3000/projects`
2. Verify your project appears
3. Click on project title
4. Check project details display correctly
5. Test back navigation

**Expected Results**:
- ✅ Project visible in listings
- ✅ All details display correctly
- ✅ Funding progress shows 0% (no donations yet)

---

## 🛒 PHASE 4: COMMERCE - PRODUCTS & SERVICES (10 minutes)

### **Step 1: Create Product**
1. Login as `service_provider` (logout from creator first)
2. Go to `http://localhost:3000/dashboard/products` or sidebar → Sell → Products
3. Click "Create Product"
4. Fill product details:
   - **Title**: `Bitcoin Development Course`
   - **Description**: `Complete 8-week course covering Bitcoin development from basics to advanced Lightning Network integration.`
   - **Price**: `500000` (sats = $25 at $50k BTC)
   - **Product Type**: `Digital`
   - **Category**: `Education`
   - **Tags**: `bitcoin`, `development`, `course`, `lightning`
   - **Inventory**: `-1` (unlimited)
5. Click "Create Product"

**Expected Results**:
- ✅ Product created successfully
- ✅ Appears in dashboard products list
- ✅ Public product page loads

### **Step 2: Create Service**
1. Go to `http://localhost:3000/dashboard/services`
2. Click "Create Service"
3. Fill service details:
   - **Title**: `Bitcoin Wallet Development`
   - **Description**: `Custom Bitcoin wallet development with Lightning Network integration. Full-stack solution with security audit.`
   - **Category**: `Development`
   - **Fixed Price**: `5000000` sats ($250)
   - **Duration**: `240` minutes (4 hours)
   - **Service Location**: `Remote`
   - **Portfolio Links**: `https://github.com/bitcoin-dev`
4. Click "Create Service"

**Expected Results**:
- ✅ Service created successfully
- ✅ Pricing displays correctly
- ✅ Service appears in listings

### **Step 3: Commerce Discovery**
1. Go to `http://localhost:3000/products`
2. Verify your product appears
3. Click product → check details
4. Go to `http://localhost:3000/services`
5. Verify your service appears
6. Test filtering by category

**Expected Results**:
- ✅ Products/services visible in public listings
- ✅ Pricing displays in sats
- ✅ Categories work

---

## 💰 PHASE 5: FINANCIAL SYSTEMS - DONATIONS & LOANS (8 minutes)

### **Step 1: Make a Donation**
1. Login as `service_provider` (or stay logged in)
2. Go to `http://localhost:3000/projects`
3. Click on the "Urban Community Garden" project
4. Click "Support Project" or donation button
5. Enter donation amount: `50000` sats
6. Add message: `"Excited to support local food sovereignty!"`
7. Click "Donate" (note: won't actually send BTC in test)

**Expected Results**:
- ✅ Donation form accepts input
- ✅ Project funding progress updates (16.7% of 300k goal)
- ✅ Transaction recorded in system

### **Step 2: Create Loan Request**
1. Login as `project_creator` (switch users)
2. Go to `http://localhost:3000/dashboard/loans`
3. Click "Create Loan"
4. Fill loan details:
   - **Title**: `Equipment Purchase Loan`
   - **Description**: `Need specialized gardening equipment and seeds for community garden expansion.`
   - **Amount**: `200000` sats
   - **Bitcoin Address**: `bc1qloanrequest123456789`
   - **Category**: `Equipment`
5. Click "Create Loan"

**Expected Results**:
- ✅ Loan request created
- ✅ Appears in dashboard loans
- ✅ Visible in public loans listing

### **Step 3: Make Loan Offer**
1. Login as `service_provider`
2. Go to `http://localhost:3000/loans`
3. Click on the equipment loan
4. Click "Make Offer"
5. Fill offer: `150000` sats at `5%` interest
6. Submit offer

**Expected Results**:
- ✅ Loan offer submitted
- ✅ Notification to loan requester
- ✅ Offer visible in loan details

---

## 💬 PHASE 6: MESSAGING SYSTEM (5 minutes)

### **Step 1: Direct Message**
1. Login as `project_creator`
2. Go to `http://localhost:3000/profiles/service_provider`
3. Click "Message" button
4. Send message: `"Hi Maria! Thanks for your donation to our garden project. Would you be interested in helping with our next expansion?"`
5. Send message

**Expected Results**:
- ✅ Message sent successfully
- ✅ Conversation created
- ✅ Appears in messages (`http://localhost:3000/messages`)

### **Step 2: Continue Conversation**
1. Go to `http://localhost:3000/messages`
2. Click on conversation with service_provider
3. Send reply: `"We could really use your development expertise for our community app."`
4. Send another message

**Expected Results**:
- ✅ Conversation history maintained
- ✅ Real-time updates (if WebSocket working)
- ✅ Message threading works

---

## 📱 PHASE 7: TIMELINE & SOCIAL FEATURES (5 minutes)

### **Step 1: Create Timeline Post**
1. Go to `http://localhost:3000/timeline` or dashboard
2. Click "Create Post" or composer
3. Write post: `"Just launched our Urban Community Garden project! 🌱 We're aiming to transform 3 abandoned lots into thriving community spaces. Check it out: [link to project] #CommunityGardening #Bitcoin #Crowdfunding"`
4. Add hashtag `#BitcoinCrowdfunding`
5. Post it

**Expected Results**:
- ✅ Post appears on timeline
- ✅ Hashtags are clickable
- ✅ Post shows in user's profile

### **Step 2: Social Interactions**
1. Login as `service_provider`
2. Go to `http://localhost:3000/timeline`
3. Find the garden project post
4. Click "Like" ❤️
5. Click "Comment" and write: `"This is an amazing initiative! I'd love to contribute my skills to build a community app for garden management."`
6. Submit comment

**Expected Results**:
- ✅ Like counter increases
- ✅ Comment appears under post
- ✅ Notification to post author

### **Step 3: Follow User**
1. Click on `project_creator` profile link
2. Click "Follow" button
3. Verify follow relationship created

**Expected Results**:
- ✅ Follow button changes to "Following"
- ✅ Follower count updates
- ✅ Follow appears in following list

---

## 🔍 PHASE 8: DISCOVERY & SEARCH (3 minutes)

### **Step 1: Global Search**
1. Use search bar in header
2. Search for: `garden`
3. Check results include project, posts, etc.
4. Search for: `#Bitcoin`
5. Check hashtag results

**Expected Results**:
- ✅ Search returns relevant results
- ✅ Fast response (< 1 second)
- ✅ Results categorized (projects, posts, users)

### **Step 2: Category Browsing**
1. Go to `http://localhost:3000/discover`
2. Filter by category: "Community"
3. Filter by category: "Education"
4. Sort by "Newest"

**Expected Results**:
- ✅ Filters work correctly
- ✅ Sorting functions
- ✅ Results update dynamically

---

## ⚙️ PHASE 9: PROFILE & SETTINGS (3 minutes)

### **Step 1: Edit Profile**
1. Go to `http://localhost:3000/dashboard/info/edit`
2. Update bio: `"Bitcoin enthusiast and community organizer focused on sustainable urban development through crowdfunding."`
3. Add website: `https://communitygarden.org`
4. Add location: `San Francisco, CA`
5. Save changes

**Expected Results**:
- ✅ Profile updates saved
- ✅ Changes reflect on public profile
- ✅ No data loss

### **Step 2: Privacy Settings**
1. Check profile visibility settings
2. Test different privacy levels
3. Verify settings persist

**Expected Results**:
- ✅ Privacy controls work
- ✅ Settings save correctly
- ✅ Profile visibility changes

---

## 🏢 PHASE 10: ORGANIZATION FEATURES (Optional - 5 minutes)

### **Step 1: Create Organization**
1. Go to `http://localhost:3000/dashboard/organizations`
2. Click "Create Organization"
3. Fill details:
   - **Name**: `Sustainable Communities Network`
   - **Description**: `Connecting communities working on environmental sustainability projects.`
   - **Website**: `https://sustainablecommunities.org`
   - **Bitcoin Address**: `bc1qorg123456789`
4. Create organization

**Expected Results**:
- ✅ Organization created
- ✅ Creator becomes owner
- ✅ Organization appears in listings

---

## ✅ PHASE 11: FINAL VERIFICATION (2 minutes)

### **Database Check**
Run in terminal:
```bash
node scripts/db-verify-fixes.mjs
```
**Expected**: ✅ Still 100% success

### **Application Check**
1. Refresh all major pages
2. Check for any new errors
3. Verify all created content still exists
4. Test cross-user interactions

**Expected Results**:
- ✅ No new errors introduced
- ✅ All data persists
- ✅ Relationships maintained

---

## 📊 TESTING RESULTS SUMMARY

### **Record Your Results**
For each phase, mark:
- ✅ **PASS**: Feature works as expected
- ⚠️ **MINOR ISSUE**: Works but with small problems
- ❌ **FAIL**: Feature broken or major issues

### **Expected Final Score**
```
🎯 BROWSER TESTING COMPLETE

✅ Authentication: PASS
✅ Project Creation: PASS
✅ Commerce System: PASS
✅ Financial Features: PASS
✅ Messaging: PASS
✅ Social Features: PASS
✅ Discovery: PASS
✅ Settings: PASS
🎉 OVERALL: 100% FUNCTIONAL
```

---

## 🚨 TROUBLESHOOTING

### **Common Issues**

**❌ "Column X does not exist"**
- Run: `supabase/sql/database_master_fix.sql` in SQL editor

**❌ "Permission denied"**
- Check RLS policies: `supabase/sql/rls_policies.sql`

**❌ Images not uploading**
- Check Supabase storage configuration

**❌ Forms not submitting**
- Check browser console for JavaScript errors
- Verify database constraints not violated

**❌ Pages not loading**
- Check `npm run dev` is running
- Verify correct URLs

---

## 🎯 SUCCESS CRITERIA

**OrangeCat is fully functional when:**
- ✅ All 10 testing phases complete successfully
- ✅ Zero database errors during testing
- ✅ All user interactions work smoothly
- ✅ Data persists between sessions
- ✅ Cross-user features work (messages, follows, etc.)
- ✅ Financial calculations accurate
- ✅ Performance acceptable (< 2s loads)

---

**🎉 READY TO TEST ORANGECAT IN THE BROWSER!**

Follow this script step-by-step, clicking through every feature. Report any issues found and we'll fix them immediately.











