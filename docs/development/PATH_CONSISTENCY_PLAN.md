# Path Consistency Plan

**Created:** 2025-01-30  
**Purpose:** Standardize all entity list pages to `/dashboard/{entity}` pattern for consistency

---

## 🎯 Current State Analysis

### ✅ Already Under `/dashboard/`
- `/dashboard` - Main dashboard
- `/dashboard/store` - Products (special name)
- `/dashboard/services` - Services
- `/dashboard/causes` - Causes
- `/dashboard/projects` - Projects
- `/dashboard/groups` - Groups (just fixed)
- `/dashboard/ai-assistants` - AI Assistants
- `/dashboard/wallets` - Wallets

### ❌ Need to Move to `/dashboard/`
- `/assets` → `/dashboard/assets`
- `/loans` → `/dashboard/loans`
- `/events` → `/dashboard/events` (needs entity list page, marketing stays at `/events`)

---

## 📋 Standardization Rules

### Pattern
- **Main Dashboard:** `/dashboard`
- **Entity List Pages:** `/dashboard/{entity}`
- **Entity Create Pages:** `/dashboard/{entity}/create`
- **Entity Detail Pages:** Can be at root level (e.g., `/projects/[id]`, `/groups/[slug]`)

### Special Cases
- **Products:** Uses `/dashboard/store` (not `/dashboard/products`) - keep as is
- **Events:** Marketing page at `/events`, entity list at `/dashboard/events`

---

## 🔧 Implementation Steps

### 1. Update Entity Registry
- `asset.basePath`: `/assets` → `/dashboard/assets`
- `asset.createPath`: `/assets/create` → `/dashboard/assets/create`
- `loan.basePath`: `/loans` → `/dashboard/loans`
- `loan.createPath`: `/loans/create` → `/dashboard/loans/create`
- `event.basePath`: `/events` → `/dashboard/events`
- `event.createPath`: `/events/create` → `/dashboard/events/create`
- `project.basePath`: `/projects` → `/dashboard/projects` (if not already)

### 2. Move Pages
- `src/app/(authenticated)/assets/page.tsx` → `src/app/(authenticated)/dashboard/assets/page.tsx`
- `src/app/(authenticated)/loans/page.tsx` → `src/app/(authenticated)/dashboard/loans/page.tsx`
- Create `src/app/(authenticated)/dashboard/events/page.tsx` (entity list)
- Keep `src/app/events/page.tsx` (marketing page)

### 3. Create Redirects
- `src/app/assets/page.tsx` → redirect to `/dashboard/assets`
- `src/app/loans/page.tsx` → redirect to `/dashboard/loans`
- Update any create page redirects

### 4. Update References
- Navigation (auto-generated from registry)
- Internal links
- User menu items
- Any hardcoded paths

### 5. Standardize Layouts
- Ensure all entity list pages use `EntityListShell`
- Loans page needs refactoring to use `EntityListShell`

---

## ✅ Success Criteria

1. All entity list pages are at `/dashboard/{entity}`
2. All entity create pages are at `/dashboard/{entity}/create`
3. All pages use `EntityListShell` for consistency
4. Old paths redirect to new paths
5. Navigation is consistent and auto-generated

---

**Last Modified:** 2025-01-30  
**Last Modified Summary:** Initial path consistency plan
