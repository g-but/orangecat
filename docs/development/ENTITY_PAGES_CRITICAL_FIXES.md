# Entity Pages Critical Fixes

**Created:** 2025-01-30  
**Priority:** CRITICAL  
**Status:** In Progress

---

## 🐛 Issues Reported

1. **Internal Server Errors** - Many entity pages (Products, Services, AI Assistance, Projects, People) showing "Internal Server Error"
2. **Messages Not Showing** - Cannot see messages page
3. **Example Data Showing** - Services showing "Assassin's Creed" as example (shouldn't show by default)
4. **Currency Issues** - Services should allow per-service currency, but using user's default
5. **No Bulk Actions** - Cannot select multiple services and delete them
6. **Inconsistent Tiles** - Project tiles don't match other entity tiles
7. **Modularity Failure** - Services works but others don't, suggesting system isn't truly DRY/modular

---

## ✅ Fixes Applied

### 1. Products API Route - Missing Logger Import
**File:** `src/app/api/products/route.ts`
**Issue:** `logger` used but not imported
**Fix:** Added `import { logger } from '@/utils/logger';`
**Status:** ✅ Fixed

---

## 🔧 Fixes Needed

### 2. Filter Example/Test Data
**Problem:** Services showing "Assassin's Creed" and other example data
**Solution:** 
- Add filter to exclude example/test data
- Options:
  - Add `is_example` boolean field to services table
  - Filter by title/content patterns (e.g., "Assassin's Creed")
  - Add `is_test_data` flag
**Priority:** High

### 3. Currency Per Service
**Problem:** Services using user's default currency instead of per-service currency
**Solution:**
- Add `currency` field to `user_services` table
- Update service creation form to include currency selector
- Update service display to show service-specific currency
**Priority:** High

### 4. Bulk Selection/Delete for Services
**Problem:** Cannot select multiple services and delete them
**Solution:**
- Add bulk selection UI (checkboxes)
- Add bulk delete functionality
- Follow pattern from Projects page
**Priority:** Medium

### 5. Project Tiles Consistency
**Problem:** Project tiles don't match other entity tiles
**Solution:**
- Refactor Projects page to use `EntityList` component
- Ensure consistent card styling
**Priority:** Medium

### 6. Investigate Modularity Issue
**Problem:** Services works but Products/Assets/AI-Assistants don't
**Solution:**
- Check all API routes for missing imports
- Verify all use same patterns
- Check error logs for specific failures
**Priority:** Critical

---

## 📋 Implementation Plan

### Phase 1: Fix Critical Errors (Immediate)
1. ✅ Fix Products API logger import
2. Check all API routes for missing imports/dependencies
3. Verify error handling in all routes
4. Test each entity page

### Phase 2: Filter Example Data (High Priority)
1. Add `is_example` field to services table (migration)
2. Update service creation to set `is_example: false`
3. Filter out `is_example: true` in list queries
4. Clean up existing example data

### Phase 3: Currency Per Service (High Priority)
1. Add `currency` field to `user_services` table
2. Update service schema
3. Update service creation form
4. Update service display

### Phase 4: Bulk Actions (Medium Priority)
1. Add selection state to Services page
2. Add checkboxes to service cards
3. Add bulk delete API endpoint
4. Add bulk action UI

### Phase 5: Consistency (Medium Priority)
1. Refactor Projects to use EntityList
2. Ensure all tiles match styling
3. Test responsive design

---

**Last Modified:** 2025-01-30  
**Last Modified Summary:** Initial critical fixes document
