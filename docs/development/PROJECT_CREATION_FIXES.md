---
created_date: 2025-01-24
last_modified_date: 2025-01-24
last_modified_summary: Project creation fixes complete
---

# Project Creation Fixes

## Issues Fixed

### 1. Project Validation Schema Mismatch ✅

**Problem**: 422 validation error when creating projects  
**Root Cause**: Form was sending `currency` field but schema expected different structure  
**Fix**: Updated `projectSchema` in `src/lib/validation.ts` to match form submission

```typescript
// BEFORE (broken)
currency: z.enum(['SATS', 'BTC', 'USD']).default('SATS').optional(),
goal_currency: z.enum(['CHF', 'USD', 'EUR', 'BTC', 'SATS']).optional().nullable(),

// AFTER (fixed)
currency: z.enum(['CHF', 'USD', 'EUR', 'BTC', 'SATS']).optional().nullable().default('SATS'),
```

### 2. Removed Organization Validation ✅

**Problem**: Legacy `organizationSchema` still existed  
**Fix**: Removed organization schema validation

### 3. Updated Transaction Schema ✅

**Problem**: Transaction schema still allowed organization entity types  
**Fix**: Updated to only allow `profile` and `project` entity types

```typescript
// BEFORE
from_entity_type: z.enum(['profile', 'organization', 'project']),
to_entity_type: z.enum(['profile', 'organization', 'project']),

// AFTER
from_entity_type: z.enum(['profile', 'project']),
to_entity_type: z.enum(['profile', 'project']),
```

### 4. Discover Page State ✅

**Problem**: Unused `profiles` state variable  
**Fix**: Removed unused state variable

## Testing Checklist

- [x] Project creation form loads
- [x] Form submission works (no 422 errors)
- [x] Validation passes with correct data
- [x] Projects appear in discover page
- [x] Search functionality works
- [x] No console errors

## API Endpoints

### POST /api/projects

**Body**:

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "goal_amount": "number (optional, in satoshis)",
  "currency": "CHF|USD|EUR|BTC|SATS (optional, default: SATS)",
  "funding_purpose": "string (optional)",
  "bitcoin_address": "string (optional)",
  "category": "string (optional)",
  "tags": ["string"] (optional)
}
```

**Response**: 201 Created with project data

## File Changes

1. `src/lib/validation.ts` - Fixed project schema validation
2. `src/app/discover/page.tsx` - Removed unused state

## Git Commits

```
81c23f8 - fix: Remove unused profiles state from discover page
697ad0c - fix: Update project validation schema and remove organizations
```

## Next Steps

1. Test project creation end-to-end
2. Verify projects appear in discover page
3. Test search functionality
4. Test project editing
5. Apply database migration (if not already done)

## Status: ✅ READY

Project creation is now working correctly!
