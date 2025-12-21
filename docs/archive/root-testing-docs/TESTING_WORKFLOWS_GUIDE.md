# 🧪 OrangeCat Comprehensive Testing Guide

## 🎯 TESTING OBJECTIVE
Test ALL workflows and entity creation in OrangeCat after the database fixes to ensure everything works perfectly.

## 🚀 QUICK START TESTING

### **Step 1: Start the Application**
```bash
cd /home/g/dev/orangecat
npm run dev
# Should start on http://localhost:3000 (or 3001/3002 depending on port)
```

### **Step 2: Run Database Verification**
```bash
# Verify database fixes worked
node scripts/db-verify-fixes.mjs
```

---

## 📋 COMPREHENSIVE TESTING CHECKLIST

## 1. 🔐 AUTHENTICATION & USER MANAGEMENT

### **User Registration & Login**
- [ ] Visit homepage (`/`)
- [ ] Click "Get Started Today" or "Sign Up"
- [ ] Complete registration form
- [ ] Verify email confirmation (if enabled)
- [ ] Login with new credentials
- [ ] Verify dashboard loads correctly

### **Profile Management**
- [ ] Go to Profile → Edit Profile (`/dashboard/info/edit`)
- [ ] Update bio, location, website, social links
- [ ] Upload avatar and banner images
- [ ] Save changes
- [ ] Verify changes appear on profile page (`/profiles/me`)
- [ ] Test profile visibility settings

---

## 2. 🎯 PROJECT/CAMPAIGN MANAGEMENT

### **Project Creation**
- [ ] Navigate to `/projects/create`
- [ ] Select template (Community Garden, Personal Project, etc.)
- [ ] Fill out project details:
  - [ ] Title and description
  - [ ] Funding goal (in satoshis)
  - [ ] Bitcoin address
  - [ ] Category and tags
  - [ ] Cover image upload
- [ ] Click "Create Project"
- [ ] Verify project appears in dashboard (`/dashboard/projects`)
- [ ] Verify project page loads (`/projects/{id}`)

### **Project Management**
- [ ] Edit project details
- [ ] Update funding goal and description
- [ ] Change Bitcoin address
- [ ] Add/update cover image
- [ ] Publish/unpublish project
- [ ] Delete project (if unpublished)

### **Project Discovery**
- [ ] Browse projects (`/projects` or `/discover`)
- [ ] Filter by category
- [ ] Search by keywords
- [ ] Sort by newest, most funded, etc.
- [ ] Click through to individual project pages

---

## 3. 🛒 COMMERCE SYSTEM (Products & Services)

### **Product Creation**
- [ ] Go to Dashboard → Sell → Products (`/dashboard/store` or `/dashboard/products`)
- [ ] Click "Create Product"
- [ ] Fill product details:
  - [ ] Title, description, price (in satoshis)
  - [ ] Product type (physical/digital/service)
  - [ ] Images upload
  - [ ] Category and tags
  - [ ] Inventory count
  - [ ] Fulfillment type
- [ ] Publish product
- [ ] Verify appears in store (`/store` or `/products`)

### **Service Creation**
- [ ] Go to Dashboard → Sell → Services (`/dashboard/services`)
- [ ] Click "Create Service"
- [ ] Fill service details:
  - [ ] Title, description, category
  - [ ] Hourly rate or fixed price (in satoshis)
  - [ ] Duration, availability schedule
  - [ ] Service location type (remote/onsite/both)
  - [ ] Portfolio links and images
- [ ] Publish service
- [ ] Verify appears in services listing

### **Commerce Discovery**
- [ ] Browse products (`/products`)
- [ ] Browse services (`/services`)
- [ ] Filter by category
- [ ] Search functionality
- [ ] Individual product/service pages

---

## 4. 💰 LOAN SYSTEM

### **Loan Creation**
- [ ] Go to Dashboard → Manage → Loans (`/dashboard/loans`)
- [ ] Click "Create Loan"
- [ ] Fill loan details:
  - [ ] Title, description, loan category
  - [ ] Original amount, remaining balance
  - [ ] Interest rate (0-100%)
  - [ ] Bitcoin address
  - [ ] Duration/repayment terms
- [ ] Publish loan request
- [ ] Verify appears in loans listing (`/loans`)

### **Loan Offers & Payments**
- [ ] Browse available loans
- [ ] Make loan offer (as different user)
- [ ] Accept loan offer
- [ ] Make loan payment
- [ ] Verify payment tracking
- [ ] Mark loan as repaid

### **Loan Discovery**
- [ ] Browse loans (`/loans`)
- [ ] Filter by category and status
- [ ] View loan details and terms

---

## 5. 🏢 ORGANIZATION MANAGEMENT

### **Organization Creation**
- [ ] Go to Dashboard → Network → Organizations (`/dashboard/organizations`)
- [ ] Click "Create Organization"
- [ ] Fill organization details:
  - [ ] Name, slug, description
  - [ ] Avatar and banner images
  - [ ] Website, Bitcoin addresses
- [ ] Publish organization
- [ ] Verify appears in organizations listing

### **Organization Membership**
- [ ] Invite members to organization
- [ ] Accept membership invitation (as different user)
- [ ] Change member roles (owner/admin/member)
- [ ] Remove members
- [ ] Transfer ownership

---

## 6. 💬 MESSAGING SYSTEM

### **Direct Messages**
- [ ] Visit another user's profile
- [ ] Click "Message" button
- [ ] Send direct message
- [ ] Reply in conversation
- [ ] Send images/attachments (if supported)
- [ ] Mark conversation as read

### **Group Conversations**
- [ ] Create group conversation
- [ ] Add multiple participants
- [ ] Send messages in group
- [ ] Manage group settings (name, participants)

### **Message Management**
- [ ] View conversation list (`/messages`)
- [ ] Search conversations
- [ ] Delete messages
- [ ] Archive conversations

---

## 7. 📱 TIMELINE & SOCIAL FEATURES

### **Post Creation**
- [ ] Go to Timeline (`/timeline` or dashboard)
- [ ] Create text post
- [ ] Create post with images
- [ ] Create post with links
- [ ] Tag other users
- [ ] Use hashtags

### **Social Interactions**
- [ ] Like posts
- [ ] Comment on posts
- [ ] Share/quote posts
- [ ] Follow/unfollow users
- [ ] View follower/following lists

### **Timeline Features**
- [ ] Scroll through timeline
- [ ] Filter timeline by type
- [ ] Search posts
- [ ] View trending topics

---

## 8. 🔍 DISCOVERY & SEARCH

### **Global Search**
- [ ] Use main search bar
- [ ] Search for users, projects, products, services
- [ ] Search by hashtags and keywords
- [ ] Filter search results

### **Category Browsing**
- [ ] Browse by categories (`/categories`)
- [ ] Filter within categories
- [ ] View featured content

### **Community Features**
- [ ] Browse community section
- [ ] Join community discussions
- [ ] View community guidelines

---

## 9. ⚙️ SETTINGS & PREFERENCES

### **Account Settings**
- [ ] Update password
- [ ] Change email
- [ ] Manage notification preferences
- [ ] Privacy settings

### **Wallet Management**
- [ ] View connected wallets (`/dashboard/wallets`)
- [ ] Add new wallet
- [ ] Set primary wallet
- [ ] Manage wallet permissions

### **Asset Management**
- [ ] View assets (`/dashboard/assets`)
- [ ] Add new asset
- [ ] Update asset details
- [ ] Manage asset visibility

---

## 10. 📊 DASHBOARD & ANALYTICS

### **Personal Dashboard**
- [ ] Overview of all activities
- [ ] Recent projects, products, services
- [ ] Financial summary (raised, donated)
- [ ] Message notifications

### **Management Dashboards**
- [ ] Projects dashboard (`/dashboard/projects`)
- [ ] Products dashboard (`/dashboard/products`)
- [ ] Services dashboard (`/dashboard/services`)
- [ ] Loans dashboard (`/dashboard/loans`)

---

## 🧪 TESTING ENVIRONMENT SETUP

### **Multiple Test Users**
Create several test accounts to test interactions:

1. **User A**: Project creator, product seller
2. **User B**: Service provider, loan seeker
3. **User C**: Investor, buyer, lender
4. **User D**: Organization admin

### **Test Data Creation Script**
```bash
# Create test data for comprehensive testing
node scripts/create-sample-data.js
```

### **Browser Testing Setup**
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on desktop and mobile
- [ ] Test different screen sizes
- [ ] Test offline functionality (if implemented)

---

## 🔍 VERIFICATION CHECKLIST

### **Database Integrity**
- [ ] Run `node scripts/db-verify-fixes.mjs` - should pass 100%
- [ ] Check that all created entities appear in database
- [ ] Verify foreign key relationships work
- [ ] Confirm RLS policies prevent unauthorized access

### **Performance Testing**
- [ ] Page load times under 2 seconds
- [ ] Search queries return results quickly
- [ ] Image uploads work smoothly
- [ ] Real-time features (messages, notifications) work

### **Security Testing**
- [ ] Users cannot access others' private data
- [ ] Payment information is handled securely
- [ ] File uploads are validated
- [ ] Rate limiting works on API calls

### **User Experience**
- [ ] All forms validate input properly
- [ ] Error messages are clear and helpful
- [ ] Loading states work correctly
- [ ] Responsive design works on all devices

---

## 🚨 COMMON ISSUES TO WATCH FOR

### **Database-Related Issues**
- [ ] "Column X does not exist" errors
- [ ] Foreign key constraint violations
- [ ] RLS policy blocking legitimate access
- [ ] Currency/unit conversion errors

### **Authentication Issues**
- [ ] Session not persisting
- [ ] Incorrect user permissions
- [ ] Profile data not loading

### **File Upload Issues**
- [ ] Images not uploading to Supabase Storage
- [ ] Incorrect bucket permissions
- [ ] File size/type validation failing

### **Real-time Features**
- [ ] WebSocket connections failing
- [ ] Message delivery issues
- [ ] Notification delays

---

## 📝 TESTING LOG TEMPLATE

Use this template for each major workflow:

```
WORKFLOW: [e.g., Project Creation]
START TIME: [timestamp]
STEPS TAKEN:
1. Navigate to /projects/create
2. Select Community Garden template
3. Fill form: title, description, goal, address
4. Click Create Project
5. Verify success redirect

EXPECTED RESULTS:
- Project created successfully
- Appears in dashboard
- Public page loads correctly

ACTUAL RESULTS:
- [Pass/Fail] Project created
- [Pass/Fail] Dashboard shows project
- [Pass/Fail] Public page works

ISSUES FOUND:
- [List any bugs or unexpected behavior]

FIXES APPLIED:
- [Any immediate fixes made]

COMMENTS:
- [Additional observations]
```

---

## 🎯 SUCCESS CRITERIA

### **All Systems Operational**
- [ ] ✅ All entity creation workflows work
- [ ] ✅ All editing and management features work
- [ ] ✅ All discovery and search features work
- [ ] ✅ All social and communication features work
- [ ] ✅ All financial/payment features work
- [ ] ✅ All administrative features work

### **Performance Standards Met**
- [ ] ✅ Page loads < 2 seconds
- [ ] ✅ Database queries < 500ms
- [ ] ✅ File uploads < 10 seconds
- [ ] ✅ Search results < 1 second

### **Security Verified**
- [ ] ✅ No unauthorized data access
- [ ] ✅ All user data properly isolated
- [ ] ✅ Payment information secure
- [ ] ✅ File uploads validated

### **User Experience Excellent**
- [ ] ✅ All forms work correctly
- [ ] ✅ Error handling comprehensive
- [ ] ✅ Mobile experience smooth
- [ ] ✅ Accessibility standards met

---

## 🚀 EXECUTION SUMMARY

**Time Estimate**: 2-4 hours for comprehensive testing
**Required**: Multiple browser tabs, multiple test users
**Tools Needed**: Browser dev tools, database access, test user accounts

**Final Command**:
```bash
echo "🎉 OrangeCat Testing Complete!"
echo "✅ All workflows verified"
echo "✅ Database integrity confirmed"
echo "✅ Performance standards met"
echo "🚀 Ready for production!"
```











