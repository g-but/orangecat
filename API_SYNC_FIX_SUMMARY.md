# API Response Format Sync Fix

**Date**: 2025-12-02
**Issue**: After API refactoring to standardized responses, frontend code was still expecting old response formats, causing wallets and favorites to not display.

---

## Root Cause

The API endpoints were migrated to use `apiSuccess()` from `src/lib/api/standardResponse.ts`, which wraps responses in a standard format:

```json
{
  "success": true,
  "data": <actual data>,
  "metadata": {
    "timestamp": "2025-12-02T..."
  }
}
```

However, frontend components were still expecting the **old response formats**:

- Wallets API old format: `{ wallets: [...] }`
- Favorites API old format: `[...]` (direct array)

---

## Issues Found and Fixed

### 1. Dashboard Wallets Not Showing

**File**: `src/app/(authenticated)/dashboard/wallets/page.tsx:117`

**Problem**:

```typescript
// Expected: data.wallets or data as array
setWallets(Array.isArray(data.wallets) ? data.wallets : Array.isArray(data) ? data : []);
```

**Root Cause**: API returns `{ success: true, data: [...] }`, but code checked for `data.wallets` (undefined) and `Array.isArray(data)` (false, because `data` is an object).

**Fix**:

```typescript
// Correctly access data.data
setWallets(Array.isArray(data.data) ? data.data : []);
```

---

### 2. Favorite Projects Not Displaying

**File**: `src/app/(authenticated)/dashboard/projects/page.tsx:55, 87`

**Problem**:

```typescript
// Expected: result.data as array
if (Array.isArray(result.data)) {
  favoritesData = result.data;
}
```

**Root Cause**: Favorites API returns `{ success: true, data: { data: [...], count: N } }`, but code accessed `result.data` which is the wrapper object `{ data: [...], count: N }`, not the array.

**Fix**:

```typescript
// Correctly access nested data.data
if (result.data && Array.isArray(result.data.data)) {
  favoritesData = result.data.data;
}
```

---

### 3. Public Profile Wallets Showing Wrong Count

**Files**:

- `src/components/profile/PublicProfileClient.tsx:116`
- `src/components/profile/UnifiedProfileLayout.tsx:85-86`

**Problem**:

```typescript
// PublicProfileClient
setWallets(Array.isArray(data.wallets) ? data.wallets : []);

// UnifiedProfileLayout
if (response.ok && data.wallets) {
  setWallets(data.wallets);
}
```

**Root Cause**: Same as #1 - checking for `data.wallets` which doesn't exist in the new format.

**Fix**:

```typescript
// PublicProfileClient
setWallets(Array.isArray(data.data) ? data.data : []);

// UnifiedProfileLayout
if (response.ok && Array.isArray(data.data)) {
  setWallets(data.data);
}
```

---

## API Response Formats (Current)

### Wallets API (`/api/wallets`)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "label": "Rent Wallet",
      "address_or_xpub": "bc1...",
      ...
    }
  ],
  "metadata": {
    "timestamp": "2025-12-02T..."
  }
}
```

### Favorites API (`/api/projects/favorites`)

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "Project Name",
        ...
      }
    ],
    "count": 5
  },
  "metadata": {
    "timestamp": "2025-12-02T..."
  }
}
```

---

## Files Modified

1. ✅ `src/app/(authenticated)/dashboard/wallets/page.tsx`
2. ✅ `src/app/(authenticated)/dashboard/projects/page.tsx` (2 locations)
3. ✅ `src/components/profile/PublicProfileClient.tsx`
4. ✅ `src/components/profile/UnifiedProfileLayout.tsx`

---

## Testing Checklist

- [ ] Dashboard Wallets page shows all wallets
- [ ] Dashboard Projects page - Favorites tab shows favorited projects
- [ ] Public profile wallets tab shows correct wallet count and list
- [ ] No console errors about undefined properties
- [ ] Deleted wallets don't appear in any view
- [ ] Wallet count matches actual wallet count

---

## Notes

- The `ProfileWalletsTab.tsx` component was already using `data.data`, so it was correct and required no changes
- The standardized response format is defined in `src/lib/api/standardResponse.ts`
- All API endpoints should now consistently use `apiSuccess()` for successful responses
- Frontend code should consistently expect `{ success: true, data: ... }` format

---

## Prevention

To prevent this issue in the future:

1. **Create a typed API client** that enforces response format expectations
2. **Add integration tests** that verify API response formats match frontend expectations
3. **Document API response formats** in a central location (e.g., `docs/api/`)
4. **Use TypeScript types** for API responses to catch mismatches at compile time

Example typed response:

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Usage
const response: ApiSuccessResponse<Wallet[]> = await fetch('/api/wallets').then(r => r.json());
const wallets = response.data; // TypeScript ensures correct access
```
