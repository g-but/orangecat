# Navigation Architecture Handoff Document

**Date:** 2025-12-12
**Status:** Partially Complete - Build Error Needs Resolution
**Priority:** High - App Not Loading

---

## Executive Summary

A navigation architecture review and cleanup was performed. Significant improvements were made to centralize navigation configuration, but a build error emerged that prevents the app from loading.

---

## Current Build Error (BLOCKING)

### Error Message
```
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
```

### Runtime Error (Before Build Fix)
```
__webpack_require__.n is not a function
at ErrorBoundary.tsx:8:104
at ClientErrorBoundary.tsx:6:72
at RootLayout (src/app/layout.tsx:270:11)
```

### Investigation Done
- No direct imports of `next/document` found in codebase
- Error occurs during static page generation for `/404`
- Likely caused by a dependency importing `next/document` incorrectly
- `ErrorBoundary.tsx` imports `logger` from `@/utils/logger` - this works fine
- Files checked: `src/app/error.tsx`, `src/app/not-found.tsx` - both are clean

### Suggested Next Steps
1. Run `npm run dev` and check browser console for full stack trace
2. Check if any lazy-loaded components in `layout.tsx` cause the issue
3. Try removing dynamic imports one by one to isolate the problem
4. Check `node_modules` for corrupted packages: `rm -rf node_modules && npm install`
5. Check if `sonner`, `@vercel/analytics`, or other packages have compatibility issues with Next.js 15.5.7

---

## Completed Work

### 1. Created Centralized Route Configuration
**File:** `src/config/routes.ts`

```typescript
// Route contexts for categorization
ROUTE_CONTEXTS = {
  authenticated: ['/dashboard', '/profile', '/settings', ...],
  public: ['/', '/discover', '/community', ...],
  universal: ['/about', '/blog', '/docs', '/privacy', '/terms', '/faq'],
  auth: ['/auth', '/auth/callback', ...],
  contextual: ['/profiles']
}

// Helper functions
- getRouteContext(pathname): RouteContext
- isAuthenticatedRoute(pathname): boolean
- shouldShowFooter(pathname): boolean
- shouldShowSidebar(pathname): boolean
```

### 2. Unified Navigation Configuration
**File:** `src/config/navigation.ts`

Contains ALL navigation config in one place:
- `sidebarSections` - 7 sections: Home, Sell, Raise, Network, Manage, Explore, **Learn**
- `bottomNavItems` - View Profile, Settings
- `footerNavigation` - Product, Company, Legal, Social links
- `userMenuItems` - User dropdown menu items
- `authNavigationItems` - Sign In, Get Started buttons
- `getHeaderNavigationItems(user)` - Context-aware header nav
- `navigationLabels` - Accessibility labels

**Key Addition:** "Learn" section with About, Blog, Docs, FAQ, Privacy - makes these pages accessible from authenticated sidebar.

### 3. Centralized Z-Index Management
**File:** `src/constants/z-index.ts`

```typescript
Z_INDEX = {
  BASE: 0,
  SIDEBAR: 30,
  HEADER: 40,
  MOBILE_BOTTOM_NAV: 45,
  DROPDOWN: 50,
  MODAL: 70,
  MOBILE_MENU: 90,
  TOAST: 100,
  ...
}

Z_INDEX_CLASSES = {
  HEADER: 'z-40',
  SIDEBAR: 'z-30',
  ...
}
```

### 4. Deprecated Old Navigation Config
**File:** `src/config/navigationConfig.ts`

Now just re-exports from `navigation.ts` for backward compatibility:
```typescript
// @deprecated - Use @/config/navigation.ts instead
export { sidebarSections as navigationSections, ... } from './navigation';
```

### 5. Updated Root Layout
**File:** `src/app/layout.tsx`

Changed from inline route detection:
```typescript
// OLD (removed)
const isAuthenticatedRoute =
  pathname.startsWith('/dashboard') ||
  pathname.startsWith('/profile') || ...

// NEW
import { isAuthenticatedRoute as checkAuthRoute } from '@/config/routes';
const isAuthenticated = checkAuthRoute(pathname);
```

### 6. Removed Unused Files
- `src/components/layout/AuthenticatedShell.tsx` - Deleted (was unused)
- `src/components/layout/AuthenticatedHeader.tsx` - Already deleted by user
- `src/components/layout/UnifiedHeader.tsx` - Already deleted by user

---

## Current Architecture

### File Structure
```
src/config/
├── routes.ts              # Centralized route detection (NEW)
├── navigation.ts          # Single source of truth for all nav (UPDATED)
└── navigationConfig.ts    # Deprecated, re-exports from navigation.ts

src/components/layout/
├── AppShell.tsx           # Unified shell component (NEW by user)
├── Header.tsx             # Unified header (NEW by user)
├── Footer.tsx             # Public pages only
├── HeaderNavigation.tsx   # Reusable nav items
└── MobileBottomNav.tsx    # Mobile tab bar

src/components/sidebar/
├── Sidebar.tsx            # Main sidebar with 7 sections
├── SidebarNavigation.tsx  # Navigation sections renderer
├── SidebarNavItem.tsx     # Individual nav item
└── SidebarUserProfile.tsx # User profile at top of sidebar

src/components/navigation/
└── ContextualLoader.tsx   # Route-specific loading states (NEW by user)

src/constants/
└── z-index.ts             # Centralized z-index values (NEW)
```

### Navigation Flow
```
RootLayout
└── AppShell (handles all navigation logic)
    ├── Header (unified, context-aware)
    │   ├── Logo
    │   ├── Desktop Nav Links
    │   ├── Search
    │   ├── Messages/Notifications (auth only)
    │   └── User Dropdown / Auth Buttons
    ├── Sidebar (authenticated routes only)
    │   ├── Home (Dashboard, Timeline, Messages, Profile)
    │   ├── Sell (Products, Services)
    │   ├── Raise (Projects, Causes)
    │   ├── Network (Organizations, People)
    │   ├── Manage (Wallets, Assets, Loans)
    │   ├── Explore (Discover, Community, Channel)
    │   └── Learn (About, Blog, Docs, FAQ, Privacy) ← NEW
    ├── Main Content
    ├── Footer (public routes only)
    └── MobileBottomNav (context-aware)
```

---

## About/Blog Accessibility (Original Request)

**Problem:** About and Blog pages were not accessible from authenticated pages.

**Solution:** Added "Learn" section to sidebar (collapsed by default):
- About (`/about`)
- Blog (`/blog`)
- Docs (`/docs`)
- FAQ (`/faq`)
- Privacy (`/privacy`)

Now accessible from:
1. **Sidebar** - Under "Learn" section (all authenticated pages)
2. **Footer** - Company section (public pages)
3. **Header mobile menu** - "About" link (public pages, logged-out users)

---

## Files Modified by This Session

| File | Action | Description |
|------|--------|-------------|
| `src/config/routes.ts` | Created (by user) | Centralized route detection |
| `src/config/navigation.ts` | Updated (by user) | Added Learn section, unified config |
| `src/config/navigationConfig.ts` | Replaced | Now re-exports from navigation.ts |
| `src/constants/z-index.ts` | Created (by user) | Centralized z-index values |
| `src/app/layout.tsx` | Updated | Uses centralized route detection |
| `src/components/layout/AuthenticatedShell.tsx` | Deleted | Unused after AppShell |
| `src/components/layout/AppShell.tsx` | Created (by user) | Unified navigation shell |
| `src/components/layout/Header.tsx` | Created (by user) | Unified header |
| `src/components/navigation/ContextualLoader.tsx` | Created (by user) | Informative loading states |

---

## Pre-existing TypeScript Errors (Unrelated to Navigation)

The following errors existed before navigation changes and are unrelated:

1. **Database type mismatches** in messaging API routes
2. **Profile type incompatibilities** in dashboard pages
3. **Missing properties** in loan creation page
4. **Unused `@ts-expect-error` directives**

These should be addressed separately.

---

## Recommended Next Actions

### Priority 1: Fix Build Error
1. Check if the error is from a dependency update
2. Try `rm -rf node_modules .next && npm install`
3. Check lazy imports in `layout.tsx` - one may be causing the issue
4. The dynamic imports that could be problematic:
   ```typescript
   const DynamicToaster = lazy(() => import('sonner')...);
   const DynamicAnalytics = lazy(() => import('@vercel/analytics/react')...);
   const DynamicSpeedInsights = lazy(() => import('@vercel/speed-insights/next')...);
   const DynamicAppShell = lazy(() => import('@/components/layout/AppShell')...);
   ```

### Priority 2: Clean Up Old Files
After build is fixed:
1. Delete `src/config/navigationConfig.ts` entirely once all imports are migrated
2. Update any remaining imports from old config files

### Priority 3: Consider Future Improvements
1. Add keyboard shortcuts for sidebar navigation (partially implemented in `NavigationShortcuts.tsx`)
2. Add user preference for default sidebar expansion state
3. Consider making "Learn" section expanded by default for discoverability

---

## Testing Checklist

After fixing the build:

- [ ] App loads without errors
- [ ] Public pages show header + footer (no sidebar)
- [ ] Authenticated pages show header + sidebar (no footer)
- [ ] "Learn" section visible in sidebar (collapsed)
- [ ] About, Blog, Docs accessible from sidebar
- [ ] Mobile navigation works correctly
- [ ] Route transitions show contextual loader
- [ ] Z-index layering correct (header above sidebar, modals above both)

---

## Contact

If questions arise, the key files to understand the architecture are:
1. `src/config/routes.ts` - Route categorization
2. `src/config/navigation.ts` - All navigation items
3. `src/components/layout/AppShell.tsx` - Main shell logic
4. `src/components/layout/Header.tsx` - Header implementation

The ContextualLoader at `src/components/navigation/ContextualLoader.tsx` is a nice UX addition that shows route-specific information during page loads instead of a generic spinner.
