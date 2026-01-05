# Entity Management Reliability Analysis

**Created:** 2026-01-04  
**Purpose:** Comprehensive analysis of potential reliability issues in entity management (creation, editing, deletion, display) similar to the currency issue that broke the system.

---

## 🔴 Critical Issues Found

### 1. Empty String Normalization Missing in Update Payloads

**Problem:** Zod schemas allow empty strings via `.or(z.literal(''))`, but PostgreSQL expects `null` for optional fields. The `buildUpdatePayload` function doesn't normalize empty strings to `null`.

**Impact:**
- Database constraint violations (e.g., UUID fields receiving empty strings)
- URL validation failures (empty strings fail URL validation)
- Inconsistent data (some fields have `''`, others have `null`)

**Affected Fields:**
- `description` (all entities)
- `bitcoin_address`, `lightning_address` (all entities)
- `thumbnail_url`, `banner_url`, `avatar_url` (all entities)
- `category` (all entities)
- `service_area` (services)
- `venue_name`, `venue_address`, etc. (events)
- `loan_category_id` (loans - UUID field!)

**Example:**
```typescript
// Current behavior in buildUpdatePayload.ts
if (!options?.includeUndefined && (sourceValue === undefined || sourceValue === null)) {
  // Empty strings pass through!
}

// Loan service manually handles this:
const normalizeToNull = (value: any) => {
  if (value === '' || value === null || value === undefined) return null;
  return value;
};
```

**Fix Required:** Add empty string normalization to `buildUpdatePayload` or create a transform utility.

---

### 2. Date Field Normalization Inconsistent

**Problem:** Only Events have date normalization. Other entities with date fields (Projects: `start_date`, `target_completion`) don't normalize dates.

**Impact:**
- Date fields might be stored as strings instead of ISO format
- Date comparisons might fail
- Timezone issues

**Current State:**
- ✅ Events: Uses `normalizeDates()` helper
- ❌ Projects: No date normalization
- ❌ Loans: `origination_date`, `maturity_date` - no normalization

**Fix Required:** Add date normalization to all entities with date fields.

---

### 3. Currency Field Defaults Missing in Updates

**Problem:** Currency fields don't have defaults in update payload builders. If currency is `null`/`undefined` during update, it might not be set properly.

**Impact:**
- Currency might be lost during updates
- Display issues (showing wrong currency)
- Similar to the original currency bug

**Current State:**
```typescript
// Products, Services, Causes, Events - NO default
{ from: 'currency' }

// Should be:
{ from: 'currency', default: 'CHF' } // or user's preference
```

**Fix Required:** Add currency defaults to all update payload builders, or ensure EntityForm sets currency before submission.

---

### 4. Array Fields Not Normalized

**Problem:** Array fields like `images`, `tags`, `beneficiaries` have defaults of `[]`, but if they're `null`/`undefined` from database, they might not be handled correctly.

**Impact:**
- Runtime errors when trying to `.map()` over null arrays
- Display issues (showing "null" instead of empty list)

**Current State:**
```typescript
// Schemas have defaults:
tags: z.array(z.string()).optional().default([])

// But update payloads don't ensure arrays:
{ from: 'tags', default: [] } // Only applies if undefined/null, not if null from DB
```

**Fix Required:** Ensure arrays are always normalized to `[]` if null/undefined.

---

### 5. UUID Fields Receiving Empty Strings

**Problem:** UUID fields like `loan_category_id`, `asset_id`, `compute_provider_id` can receive empty strings from forms, but PostgreSQL UUID columns reject empty strings.

**Impact:**
- Database constraint violations
- Entity creation/update failures

**Current State:**
- ✅ Loans: Manually normalizes UUID fields (`normalizeToNull`)
- ❌ Other entities: No normalization for UUID fields

**Affected Fields:**
- `loan_category_id` (loans) - ✅ Fixed manually
- `asset_id` (events) - ❌ Not normalized
- `compute_provider_id` (ai_assistants) - ❌ Not normalized

**Fix Required:** Add UUID field normalization to all entities.

---

### 6. URL Fields Not Normalized

**Problem:** URL fields can receive empty strings, but Zod URL validation might pass them through as `''` (via `.or(z.literal(''))`), which then fail database constraints or cause display issues.

**Impact:**
- Database constraint violations
- Broken image links (showing empty string instead of placeholder)

**Affected Fields:**
- `thumbnail_url`, `banner_url`, `avatar_url` (all entities)
- `website_url` (projects, organizations)
- `online_url` (events)
- `portfolio_links` (services - array of URLs)

**Fix Required:** Normalize empty strings to `null` for all URL fields.

---

### 7. Number Fields Missing Null Handling

**Problem:** Optional number fields like `price_sats`, `goal_sats`, `hourly_rate_sats` might be `null` from database, but update payloads don't handle this consistently.

**Impact:**
- Type errors (trying to do math on null)
- Display issues (showing "null" instead of "0" or empty)

**Current State:**
```typescript
// Update payloads just pass through:
{ from: 'price_sats' } // If null, stays null

// Should handle null properly:
{ from: 'price_sats', transform: (v) => v ?? null } // Explicit null handling
```

**Fix Required:** Ensure number fields explicitly handle null values.

---

### 8. Status Field Defaults Inconsistent

**Problem:** Status fields have defaults in schemas, but update payloads might not preserve them if status is omitted.

**Impact:**
- Status might be lost during updates
- Entities might become unsearchable (status = null)

**Current State:**
- ✅ Causes: `{ from: 'status', default: 'draft' }`
- ✅ Events: `{ from: 'status', default: 'draft' }`
- ❌ Products: No status in update payload (but has default in schema)
- ❌ Services: No status in update payload (but has default in schema)

**Fix Required:** Ensure all entities with status fields include them in update payloads with defaults.

---

## 🟡 Medium Priority Issues

### 9. Missing Transform Functions for Complex Fields

**Problem:** Complex fields like `availability_schedule`, `distribution_rules`, `recurrence_pattern` (JSON objects) don't have validation/transformation.

**Impact:**
- Invalid JSON might be stored
- Runtime errors when parsing

**Fix Required:** Add JSON validation/transformation for complex fields.

---

### 10. Missing Validation for Related Fields

**Problem:** Some fields have dependencies (e.g., `hourly_rate_sats` OR `fixed_price_sats` required for services), but update payloads don't validate this.

**Impact:**
- Invalid entities can be created/updated
- Display errors

**Current State:**
- ✅ Schema validation: `userServiceSchema.refine()` checks this
- ❌ Update payload: Doesn't validate relationships

**Fix Required:** Ensure schema validation runs on updates, or add relationship validation to update payloads.

---

## ✅ Recommended Solutions

### Solution 1: Create Universal Data Normalization Utility

Create a utility function that normalizes all common data types:

```typescript
// src/lib/api/normalizeEntityData.ts
export function normalizeEntityData<T extends Record<string, unknown>>(
  data: T,
  config?: {
    emptyStringToNull?: boolean;
    normalizeDates?: string[];
    normalizeUUIDs?: string[];
    normalizeURLs?: string[];
    normalizeArrays?: string[];
  }
): T {
  const normalized = { ...data };
  
  // Normalize empty strings to null
  if (config?.emptyStringToNull !== false) {
    Object.keys(normalized).forEach(key => {
      if (typeof normalized[key] === 'string' && normalized[key] === '') {
        normalized[key] = null;
      }
    });
  }
  
  // Normalize dates
  if (config?.normalizeDates) {
    config.normalizeDates.forEach(field => {
      if (field in normalized) {
        normalized[field] = normalizeDate(normalized[field] as string | Date | null);
      }
    });
  }
  
  // Normalize UUIDs (empty string -> null)
  if (config?.normalizeUUIDs) {
    config.normalizeUUIDs.forEach(field => {
      if (field in normalized && normalized[field] === '') {
        normalized[field] = null;
      }
    });
  }
  
  // Normalize URLs (empty string -> null)
  if (config?.normalizeURLs) {
    config.normalizeURLs.forEach(field => {
      if (field in normalized && normalized[field] === '') {
        normalized[field] = null;
      }
    });
  }
  
  // Normalize arrays (null -> [])
  if (config?.normalizeArrays) {
    config.normalizeArrays.forEach(field => {
      if (field in normalized && (normalized[field] === null || normalized[field] === undefined)) {
        normalized[field] = [];
      }
    });
  }
  
  return normalized;
}
```

### Solution 2: Enhance buildUpdatePayload

Add transform support for common normalizations:

```typescript
// Enhanced FieldMapping with common transforms
export const commonTransforms = {
  emptyStringToNull: (v: unknown) => (v === '' ? null : v),
  nullToEmptyArray: (v: unknown) => (v === null || v === undefined ? [] : v),
  normalizeDate: (v: unknown) => normalizeDate(v as string | Date | null),
};

// Usage:
const buildProductUpdatePayload = createUpdatePayloadBuilder([
  { from: 'description', transform: commonTransforms.emptyStringToNull },
  { from: 'thumbnail_url', transform: commonTransforms.emptyStringToNull },
  { from: 'images', transform: commonTransforms.nullToEmptyArray },
]);
```

### Solution 3: Add Pre-Insert/Pre-Update Normalization Hook

Add normalization hook to `entityPostHandler` and `entityCrudHandler`:

```typescript
export interface EntityPostHandlerConfig {
  // ... existing fields
  normalizeData?: (data: Record<string, unknown>) => Record<string, unknown>;
}
```

---

## 📋 Action Items

### Priority 1 (Critical - Fix Immediately)
1. ✅ Add empty string normalization to `buildUpdatePayload`
2. ✅ Add UUID field normalization (empty string -> null)
3. ✅ Add URL field normalization (empty string -> null)
4. ✅ Add currency defaults to all update payloads

### Priority 2 (High - Fix Soon)
5. Add date normalization to Projects and Loans
6. Add array normalization (null -> [])
7. Add status field defaults to all update payloads

### Priority 3 (Medium - Fix When Possible)
8. Add JSON field validation
9. Add relationship validation to update payloads
10. Create universal normalization utility

---

## 🔍 Testing Checklist

After fixes, test:
- [ ] Creating entity with empty strings in optional fields
- [ ] Updating entity with empty strings
- [ ] Creating entity with null values from database
- [ ] Updating entity with missing currency field
- [ ] Creating entity with date fields as strings vs Date objects
- [ ] Updating entity with null arrays
- [ ] Creating entity with UUID fields as empty strings
- [ ] Updating entity with URL fields as empty strings

---

*Last Updated: 2026-01-04*
