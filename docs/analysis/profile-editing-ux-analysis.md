# Profile Editing UX Analysis & Improvement Plan

**Date**: 2025-11-19
**Status**: Analysis Complete, Ready for Implementation

## Current State Analysis

### Issue Reported

When clicking "Edit Profile" button on the profile page, it redirects to `/profiles/me` (the public profile view) instead of opening an editing interface.

### Current Architecture

#### Routes

1. **`/profiles/[username]`** - Public profile view (server component)
   - Shows public profile with tabs: Overview, Info, Projects, People, Wallets
   - Has "Edit Profile" button for own profile (currently broken)
   - Located: `src/app/profiles/[username]/page.tsx`

2. **`/profile`** - Redirects to `/profiles/me`
   - Located: `src/app/(authenticated)/profile/page.tsx`
   - Just a redirect, no actual content

3. **`/settings`** - Account settings (email, password, delete account)
   - Located: `src/app/(authenticated)/settings/page.tsx`
   - Does NOT handle profile info editing

4. **`/profile/setup`** - Old profile setup (now redirects)
   - Located: `src/app/profile/setup/page.tsx`
   - Comments mention "edit modal on profile page" but no modal exists

#### Components

1. **`PublicProfileClient.tsx`** - Profile display
   - Line 229: `<Link href="/profiles/me">` for Edit Profile button (WRONG)
   - Shows profile tabs (Overview, Info, Projects, People, Wallets)

2. **`ProfileInfoTab.tsx`** - Info tab (READ-ONLY)
   - Displays username, name, email, location, website, bio
   - No editing capability

3. **`ProfileFormFields.tsx`** - Form fields component (exists but unused)
   - Has reusable form fields for profile editing
   - Not currently used anywhere

#### Navigation Config

- **Sidebar "My Info"** → `/profile` → redirects to `/profiles/me`
- **"Edit Profile" button** → `/profiles/me` (broken loop)

### Problems Identified

#### 1. **No Profile Editing Interface**

- There's no dedicated page/modal for editing profile information
- ProfileFormFields.tsx exists but is not used
- Edit Profile button loops to the same page

#### 2. **Inconsistent Navigation**

- Sidebar "My Info" → redirects to public profile view
- No clear path to edit profile information
- Settings page only handles auth settings, not profile

#### 3. **Tab-Based Architecture Complication**

- Public profiles use tabs: Overview, Info, Projects, People, Wallets
- Info tab is read-only
- How should editing work with this structure?

#### 4. **Confusion Between Profile Types**

- Public profile view (what others see)
- Own profile view (what you see of yourself)
- Profile editing interface (currently missing)

## UX Problems

### User Journey Breakdowns

#### Current (Broken) Journey:

1. User wants to edit their profile
2. Clicks "Edit Profile" on header OR "My Info" in sidebar
3. Ends up at `/profiles/me` (same page or public view)
4. No way to edit → **Dead end**

#### Settings Journey (Incomplete):

1. User goes to Settings from sidebar
2. Can change email/password
3. Cannot edit profile info (name, bio, location, etc.)

## Proposed Solutions

### Option 1: Dedicated Edit Page (Recommended)

**Route**: `/profile/edit`

**Pros**:

- Clean separation of concerns
- Full-page form with all profile fields
- Easy to implement
- Consistent with traditional web patterns

**Cons**:

- Requires navigating away from profile
- Context switch for users

**Implementation**:

```
/profile/edit
├── Profile header (avatar, banner)
├── Form sections:
│   ├── Basic Info (name, username, bio)
│   ├── Contact (email, website, location)
│   ├── Social Links (Twitter, GitHub)
│   └── Media (avatar, banner uploads)
└── Save/Cancel buttons
```

**Changes Required**:

- Create `/app/(authenticated)/profile/edit/page.tsx`
- Create `ProfileEditForm` component using `ProfileFormFields`
- Update "Edit Profile" button → `/profile/edit`
- Update "My Info" sidebar link → `/profile/edit`
- Add "Edit" button to Info tab for own profile

### Option 2: In-Place Tab Editing

**Location**: Within the Info tab

**Pros**:

- Edit in context (same page)
- No navigation required
- Modern feel

**Cons**:

- Tab becomes dual-purpose (view + edit)
- More complex state management
- Potential confusion with tab navigation

**Implementation**:

```
Info Tab (when viewing own profile):
├── Toggle between View/Edit modes
├── View Mode: Display info (current)
├── Edit Mode: Form fields inline
└── Save/Cancel buttons
```

**Changes Required**:

- Modify `ProfileInfoTab.tsx` to add edit mode
- Add state management for edit/view toggle
- Update "Edit Profile" button → opens Info tab in edit mode

### Option 3: Modal/Drawer Overlay

**Location**: Modal over profile page

**Pros**:

- Quick access
- Maintains context
- Modern UX pattern

**Cons**:

- Limited space for long forms
- Complexity with mobile
- May feel cramped

**Implementation**:

```
Modal/Drawer:
├── Triggered by "Edit Profile" button
├── Sliding panel or centered modal
├── Profile edit form
└── Save/Cancel buttons
```

**Changes Required**:

- Create `ProfileEditModal` or `ProfileEditDrawer`
- Add modal state to `PublicProfileClient`
- Update "Edit Profile" button → opens modal

### Option 4: Hybrid Approach (Best UX)

**Combination of Options 1 & 2**

**Quick edits**: In-place editing for basic fields (name, bio)
**Full editing**: Dedicated page for comprehensive changes

**Implementation**:

```
Info Tab (own profile):
├── Quick edit buttons for name, bio
├── "Edit Full Profile" button → /profile/edit

/profile/edit:
├── Comprehensive profile editor
├── All fields including advanced options
└── Media uploads, social links, etc.
```

## Recommended Approach

### **Option 1: Dedicated Edit Page** (Simplest & Most Maintainable)

This aligns best with:

1. Current tab-based architecture
2. Separation of concerns (view vs edit)
3. Easier to implement and maintain
4. Consistent with sidebar navigation ("My Info", "My Projects", etc.)

### Implementation Plan

#### Phase 1: Create Edit Page (Priority: HIGH)

1. **Create route**: `/app/(authenticated)/profile/edit/page.tsx`
2. **Create component**: `src/components/profile/ProfileEditForm.tsx`
   - Reuse `ProfileFormFields.tsx`
   - Handle form state, validation, submission
   - Image uploads for avatar/banner
3. **Update navigation**:
   - PublicProfileClient.tsx line 229: `/profiles/me` → `/profile/edit`
   - navigationConfig.ts "My Info": `/profile` → `/profile/edit`

#### Phase 2: Enhance Info Tab (Priority: MEDIUM)

1. Add "Edit" button in `ProfileInfoTab.tsx` when viewing own profile
2. Button links to `/profile/edit`
3. Optional: Add "Edit" icon next to each editable field

#### Phase 3: Improve Settings Integration (Priority: LOW)

1. Add link from Settings to Profile Edit
2. Consolidate account vs profile settings
3. Create unified settings navigation

### Migration Path

```
Current:
- "Edit Profile" → /profiles/me (BROKEN)
- "My Info" → /profile → /profiles/me (VIEW ONLY)
- Settings → /settings (AUTH ONLY)

After Phase 1:
- "Edit Profile" → /profile/edit (WORKS!)
- "My Info" → /profile/edit (EDIT)
- Settings → /settings (AUTH ONLY)

After Phase 2:
- Info Tab → Shows "Edit" button → /profile/edit
- Seamless transition between view/edit

After Phase 3:
- Settings → Has "Edit Profile" link
- Unified settings experience
```

## Technical Considerations

### Form Fields to Include

From `Profile` type in database:

- ✅ Username (may need validation/uniqueness check)
- ✅ Name (display name)
- ✅ Bio
- ✅ Email (might keep in Settings)
- ✅ Avatar URL (upload interface)
- ✅ Banner URL (upload interface)
- ✅ Location
- ✅ Website
- ✅ Twitter handle
- ✅ GitHub handle
- ✅ Bitcoin address
- ✅ Lightning address

### Validation Rules

- Username: Unique, alphanumeric + underscore, 3-30 chars
- Email: Valid email format
- URLs: Valid URL format
- Bio: Max length (e.g., 500 chars)
- Bitcoin address: Valid BTC address format (optional validation)
- Lightning address: Valid format (optional validation)

### API Endpoints

- Existing: `PUT /api/profile` (already exists)
- May need: `POST /api/profile/avatar` for image uploads
- May need: `POST /api/profile/banner` for image uploads

### Image Upload Strategy

Use Supabase Storage:

- Bucket: `avatars` and `banners`
- File naming: `{user_id}/{timestamp}.{ext}`
- Max size: 2MB for avatars, 5MB for banners
- Supported formats: JPG, PNG, WebP

## Success Metrics

### Must Have

- [x] Analysis document created
- [ ] User can click "Edit Profile" and reach editing interface
- [ ] User can edit all profile fields
- [ ] Changes save successfully to database
- [ ] Profile view updates after save

### Nice to Have

- [ ] Image upload with preview
- [ ] Real-time username availability check
- [ ] Form auto-save (draft)
- [ ] Undo changes
- [ ] Profile completion percentage

## Files to Modify

### Create New:

1. `/app/(authenticated)/profile/edit/page.tsx` - Edit page route
2. `/components/profile/ProfileEditForm.tsx` - Main edit form
3. `/components/profile/ImageUpload.tsx` - Avatar/banner upload (optional)

### Modify Existing:

1. `/components/profile/PublicProfileClient.tsx` - Fix Edit button link
2. `/config/navigationConfig.ts` - Update "My Info" href
3. `/components/profile/ProfileInfoTab.tsx` - Add Edit button
4. `/app/(authenticated)/profile/page.tsx` - Update redirect target

## Next Steps

1. **Review and approve this plan**
2. **Create todo list for implementation**
3. **Implement Phase 1: Dedicated Edit Page**
4. **Test thoroughly**
5. **Commit and deploy**
6. **Gather user feedback**
7. **Consider Phase 2 & 3 enhancements**

## Notes

- The current `ProfileFormFields.tsx` component exists and can be reused
- Settings page focuses on authentication (email, password, account deletion)
- Profile editing should be separate from auth settings
- Tab-based architecture works well for viewing, dedicated page better for editing
- Consider mobile responsive design for edit form
- May want to add "Cancel" confirmation if there are unsaved changes
