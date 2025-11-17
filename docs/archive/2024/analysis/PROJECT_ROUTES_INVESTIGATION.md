# Project Routes Investigation Report

**Date:** 2025-01-30  
**Last Modified:** 2025-01-30  
**Last Modified Summary:** Updated to reflect route consolidation - all routes now use /projects/[id] (plural)

**Status:** ✅ **RESOLVED** - Routes consolidated to `/projects/[id]` (plural)

## Executive Summary

**Previous Issue:** There were TWO DIFFERENT ROUTES serving project detail pages with DIFFERENT LAYOUTS AND FEATURES:

1. **Public Route:** `/projects/[id]` → `src/app/projects/[id]/page.tsx`
2. **Authenticated Route:** `/project/[id]` → `src/app/(authenticated)/project/[id]/page.tsx`

**Resolution (2025-01-30):**

- ✅ All routes consolidated to `/projects/[id]` (plural)
- ✅ Old `/project/[id]` route now redirects to `/projects/[id]` for backward compatibility
- ✅ Single unified route provides consistent UX for all users
- ✅ Features merged: Public route now includes SocialMetaTags from authenticated route
- ✅ All code references updated to use `/projects/[id]`

---

## Route Structure Analysis

### Route 1: `/projects/[id]` (Public - Plural)

**File:** `src/app/projects/[id]/page.tsx`  
**Component:** `PublicProjectPage`  
**Layout:** Public (no auth required)

**Features:**

- ✅ Modern layout with title at top
- ✅ Image gallery (`ProjectMediaGallery`)
- ✅ Sidebar with project summary (`ProjectSummaryRail`)
- ✅ Two-column grid layout (`max-w-6xl`)
- ✅ Better UX with creator info near title
- ✅ Uses `CampaignShare` component
- ✅ Status badge with proper mapping
- ✅ Clickable avatar linking to profile

**Layout Structure:**

```
- Back button
- Title + Creator + Status (top section)
- Missing Wallet Banner
- Gallery (full width)
- Main Content Card (2/3 width)
- Sidebar (1/3 width) - ProjectSummaryRail
```

---

### Route 2: `/project/[id]` (Authenticated - Singular)

**File:** `src/app/(authenticated)/project/[id]/page.tsx`  
**Component:** `ProjectProfilePage`  
**Layout:** Authenticated (requires login)

**Features:**

- ❌ Older layout with title in CardHeader
- ❌ NO image gallery
- ❌ NO sidebar
- ❌ Single column layout (`max-w-4xl`)
- ❌ Creator info in CardHeader (less prominent)
- ❌ Uses `ShareButton` component (different from public)
- ❌ Has `SocialMetaTags` component
- ❌ Status badge hardcoded (less flexible)
- ✅ Clickable avatar (recently added)

**Layout Structure:**

```
- Back button + Edit/Share buttons
- Status badge
- Missing Wallet Banner
- Main Content Card (full width)
  - Title in CardHeader
  - Creator info in CardHeader
  - Content sections
- Creator Info Card (separate, at bottom)
```

---

## Route Constants

**File:** `src/lib/routes.ts`

```typescript
PROJECTS: {
  LIST: '/projects',
  CREATE: '/projects/create',
  VIEW: (id: string) => `/projects/${id}`,  // ← Uses PLURAL
  EDIT: (id: string) => `/projects/create?edit=${id}`,
}
```

**Official route constant uses PLURAL `/projects/[id]`** ✅

---

## Component Link Analysis

### Components Linking to `/projects/[id]` (Plural - CORRECT):

- ✅ `src/components/ui/ModernProjectCard.tsx` - Line 176, 235
- ✅ `src/lib/routes.ts` - Official route constant

### Components Linking to `/project/[id]` (Singular - INCORRECT):

- ❌ `src/components/ui/ModernCampaignCard.tsx` - Line 111, 225
- ❌ `src/components/projects/ProjectTile.tsx` - Line 164
- ❌ `src/app/(authenticated)/dashboard/page.tsx` - Line 296, 679
- ❌ Various other dashboard components

---

## Key Differences Summary

| Feature              | `/projects/[id]` (Public)         | `/project/[id]` (Auth)         |
| -------------------- | --------------------------------- | ------------------------------ |
| **Route Pattern**    | Plural ✅                         | Singular ❌                    |
| **Layout Width**     | `max-w-6xl`                       | `max-w-4xl`                    |
| **Layout Type**      | Two-column with sidebar           | Single column                  |
| **Image Gallery**    | ✅ Yes (`ProjectMediaGallery`)    | ❌ No                          |
| **Sidebar**          | ✅ Yes (`ProjectSummaryRail`)     | ❌ No                          |
| **Title Position**   | Top of page (outside card)        | Inside CardHeader              |
| **Creator Info**     | Near title (prominent)            | In CardHeader (less prominent) |
| **Share Component**  | `CampaignShare`                   | `ShareButton`                  |
| **Social Meta Tags** | ❌ No                             | ✅ Yes                         |
| **Status Badge**     | Dynamic mapping                   | Hardcoded                      |
| **Route Constant**   | ✅ Matches `ROUTES.PROJECTS.VIEW` | ❌ Doesn't match               |

---

## Problems Identified

### 1. **Inconsistent User Experience**

- Users see different layouts depending on authentication state
- Public users get better UX (gallery, sidebar)
- Authenticated users get worse UX (no gallery, no sidebar)

### 2. **Broken Links**

- Components linking to `/project/[id]` may work for authenticated users but:
  - Don't match the official route constant
  - May break if route is removed
  - Create confusion about which route to use

### 3. **Code Duplication**

- Two separate page components doing similar things
- Maintenance burden (fixes need to be applied twice)
- Risk of features diverging further

### 4. **Route Constant Mismatch**

- Official route constant says `/projects/[id]` (plural)
- But authenticated route uses `/project/[id]` (singular)
- Creates confusion for developers

### 5. **SEO Issues**

- Public route has no social meta tags
- Authenticated route has social meta tags but may not be accessible to crawlers
- Inconsistent metadata

---

## Root Cause

The codebase appears to have evolved with:

1. **Original route:** `/project/[id]` (singular) for authenticated users
2. **New route:** `/projects/[id]` (plural) for public access
3. **No migration:** Old route never removed, new route added alongside
4. **No standardization:** Components link to different routes inconsistently

---

## Recommendations

### Option 1: Consolidate to `/projects/[id]` (Recommended)

**Pros:**

- Matches official route constant
- Better UX (has gallery, sidebar)
- More modern layout
- Consistent with `/projects/create` pattern

**Cons:**

- Need to update all `/project/[id]` links
- Need to remove authenticated route file
- May break existing bookmarks

**Action Items:**

1. Update all components linking to `/project/[id]` → `/projects/[id]`
2. Delete `src/app/(authenticated)/project/[id]/page.tsx`
3. Add redirect from `/project/[id]` → `/projects/[id]` (if needed)
4. Ensure authenticated features work in public route

### Option 2: Consolidate to `/project/[id]` (Not Recommended)

**Pros:**

- Keeps authenticated route
- Less breaking changes

**Cons:**

- Doesn't match route constant
- Worse UX (no gallery, no sidebar)
- Inconsistent with `/projects/create`

### Option 3: Keep Both, Add Redirect

**Pros:**

- No breaking changes
- Backward compatible

**Cons:**

- Maintains confusion
- Still have duplicate code
- Doesn't solve UX inconsistency

---

## Files That Need Updates (If Consolidating to `/projects/[id]`)

1. `src/components/ui/ModernCampaignCard.tsx` - Lines 111, 225
2. `src/components/projects/ProjectTile.tsx` - Line 164
3. `src/app/(authenticated)/dashboard/page.tsx` - Lines 296, 679
4. Any other components linking to `/project/[id]`

---

## Conclusion

**The truth:** There are two conflicting routes serving the same content with different layouts. The public route (`/projects/[id]`) is newer, better designed, and matches the official route constant. The authenticated route (`/project/[id]`) is older, has worse UX, and should be consolidated into the public route.

**Recommended Action:** Consolidate everything to `/projects/[id]` and remove the duplicate authenticated route.
