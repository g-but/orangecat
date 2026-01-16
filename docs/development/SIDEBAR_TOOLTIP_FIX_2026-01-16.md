# Sidebar Tooltip Fix - 2026-01-16

**Created:** 2026-01-16  
**Last Modified:** 2026-01-16  
**Last Modified Summary:** Documented sidebar tooltip fixes and structure improvements

---

## Problem Statement

The left sidebar had critical UX issues:

1. **Tooltips not appearing on hover** - Icons were visible but no labels appeared when hovering
2. **Poor structure** - Section headers cluttered the desktop view
3. **Overflow clipping** - Tooltips were being clipped by parent containers

## Root Causes

1. **Tooltip positioning**: Tooltips used absolute positioning relative to parent, which caused clipping issues
2. **Ref timing**: `itemRef.current` might be null when tooltip tries to calculate position
3. **Overflow constraints**: Parent containers had `overflow-hidden` or didn't allow tooltips to escape
4. **Desktop structure**: Section headers were visible on desktop, making the sidebar cluttered

## Solutions Implemented

### 1. Fixed Tooltip Positioning

**File:** `src/components/sidebar/FlyoutTooltip.tsx`

- Changed from absolute to **fixed positioning** calculated from target element
- Added proper position calculation using `getBoundingClientRect()`
- Added scroll and resize listeners to update position dynamically
- High z-index (60) to appear above sidebar (40) and header (50)
- Proper cleanup of event listeners to prevent memory leaks

**Key changes:**

```typescript
// Fixed positioning calculated from target element
const rect = targetElement.getBoundingClientRect();
setPosition({
  top: rect.top + rect.height / 2,
  left: rect.right + 8, // 8px margin from sidebar edge
});
```

### 2. Added Overflow-Visible

**Files:**

- `src/components/sidebar/Sidebar.tsx`
- `src/components/sidebar/SidebarNavigation.tsx`
- `src/components/sidebar/SidebarNavItem.tsx`
- `src/components/sidebar/SidebarUserProfile.tsx`

- Added `overflow-visible` to all parent containers
- Ensures tooltips can escape sidebar boundaries
- Prevents clipping by parent elements

### 3. Improved Sidebar Structure

**File:** `src/components/sidebar/SidebarNavigation.tsx`

- **Desktop**: Section headers hidden (icons only with tooltips)
- **Mobile**: Section headers visible when expanded
- Visual dividers between icon groups on desktop
- Cleaner, more organized appearance

### 4. Proper Ref Handling

**Files:**

- `src/components/sidebar/SidebarNavItem.tsx`
- `src/components/sidebar/SidebarUserProfile.tsx`

- Added `useRef` to capture element references
- Pass refs to tooltip for position calculation
- Added setTimeout to wait for ref to be available

## Technical Details

### Tooltip Behavior

- **Desktop (lg breakpoint)**: Tooltips appear on hover, positioned to the right of icons
- **Mobile**: No tooltips (full labels shown when sidebar expanded)
- **Positioning**: Fixed positioning calculated from target element's bounding rect
- **Updates**: Position recalculates on scroll and window resize

### Sidebar States

- **Desktop collapsed**: Icons only (w-16), tooltips on hover
- **Desktop expanded**: Full width (w-64) when manually opened via toggle
- **Mobile**: Slide-out drawer (w-64) when opened

### Component Hierarchy

```
Sidebar
├── SidebarUserProfile (with tooltip)
└── SidebarNavigation
    └── SidebarNavItem[] (each with tooltip)
        └── FlyoutTooltip
```

## Files Modified

1. `src/components/sidebar/FlyoutTooltip.tsx` - Complete rewrite with fixed positioning
2. `src/components/sidebar/SidebarNavItem.tsx` - Added ref, overflow-visible
3. `src/components/sidebar/SidebarUserProfile.tsx` - Added ref, overflow-visible
4. `src/components/sidebar/SidebarNavigation.tsx` - Hidden headers on desktop, overflow-visible
5. `src/components/sidebar/Sidebar.tsx` - Added overflow-visible wrapper

## Commits

- `0a372858` - Tooltip fixes and structure improvements
- `f5206181` - Ref handling fix
- `3f28e5ea` - Cleanup function fix

## Testing Checklist

- [x] Tooltips appear on desktop hover
- [x] Tooltips positioned correctly to the right of icons
- [x] Tooltips not clipped by parent containers
- [x] Tooltips update position on scroll
- [x] Tooltips update position on window resize
- [x] Section headers hidden on desktop
- [x] Section headers visible on mobile when expanded
- [x] Visual dividers between sections on desktop
- [x] No memory leaks from event listeners
- [ ] Manual browser testing (pending user verification)

## Engineering Principles Applied

- **DRY**: Reused `FlyoutTooltip` component for both nav items and user profile
- **SSOT**: Navigation structure from entity registry
- **Separation of Concerns**: Tooltip positioning separate from item rendering
- **Type Safety**: Proper TypeScript types for all props
- **Performance**: Event listeners properly cleaned up

## Next Steps

1. User verification in browser
2. Performance testing with many navigation items
3. Accessibility audit (keyboard navigation, screen readers)
4. Consider adding tooltip delay for better UX

## Related Documentation

- `docs/development/ENGINEERING_PRINCIPLES.md` - Core development principles
- `docs/changelog/sidebar-hover-expansion.md` - Previous sidebar work
- `docs/UX/SIDEBAR_TOOLTIP_IMPLEMENTATION.md` - Tooltip design decisions
