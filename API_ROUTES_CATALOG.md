# API ROUTES CATALOG & ANALYSIS

## Complete API Route Inventory

### Authentication Routes

| Route            | Method | Handler            | Lines | Pattern |
| ---------------- | ------ | ------------------ | ----- | ------- |
| `/auth/callback` | GET    | OAuth callback     | -     | ✓       |
| `/auth/confirm`  | GET    | Email confirmation | -     | ✓       |
| `/auth/signout`  | GET    | Logout handler     | -     | ✓       |

### Organization Routes

| Route                                         | Method         | Handler          | Lines | Notes                               |
| --------------------------------------------- | -------------- | ---------------- | ----- | ----------------------------------- |
| `/api/organizations`                          | GET            | List all orgs    | 312   | **LARGE** - Manual rate limiting    |
| `/api/organizations`                          | POST           | Create org       | 312   | **LARGE** - In same file            |
| `/api/organizations/create`                   | POST           | Create org (alt) | 173   | Duplicate?                          |
| `/api/organizations/[slug]`                   | GET/PUT/DELETE | Org details      | -     |                                     |
| `/api/organizations/[slug]/settings`          | PUT            | Org settings     | 129   | Small                               |
| `/api/organizations/[slug]/treasury/activity` | GET            | Treasury logs    | 101   | **Endpoint duplicate check needed** |

### Project Routes

| Route                                  | Method         | Handler              | Lines | Pattern Issue                                         |
| -------------------------------------- | -------------- | -------------------- | ----- | ----------------------------------------------------- |
| `/api/projects`                        | GET/POST       | Projects list/create | 66    | **Uses modern pattern (apiSuccess, apiUnauthorized)** |
| `/api/projects/[id]`                   | GET/PUT/DELETE | Project details      | 164   |                                                       |
| `/api/projects/[id]/stats`             | GET            | Project stats        | 113   |                                                       |
| `/api/projects/[id]/treasury/activity` | GET            | Treasury activity    | -     |                                                       |

### Organization-Project Routes (OVERLAPPING)

| Route                                               | Method   | Handler              | Lines | Status                               |
| --------------------------------------------------- | -------- | -------------------- | ----- | ------------------------------------ |
| `/api/organizations/manage/projects`                | GET/POST | Org projects         | 166   | **Uses OLD pattern (manual checks)** |
| `/api/organizations/manage/projects/campaigns`      | GET/POST | Projects (campaigns) | 146   | **DUPLICATE?**                       |
| `/api/organizations/[slug]/treasury/addresses/next` | -        | Next address         | -     | Complex endpoint                     |

### Profile Routes

| Route                                       | Method         | Handler              | Lines | Notes                |
| ------------------------------------------- | -------------- | -------------------- | ----- | -------------------- |
| `/api/profile`                              | GET/PUT/DELETE | Current user profile | 101   |                      |
| `/api/profiles/[userId]`                    | GET            | User profile         | -     |                      |
| `/api/profiles/[userId]/organizations`      | GET            | User's orgs          | 107   |                      |
| `/api/profiles/[userId]/projects`           | GET            | User's projects      | 113   |                      |
| `/api/profiles/[userId]/projects/campaigns` | GET            | User's campaigns     | 108   | **Duplicate route?** |

### Association Routes

| Route                                 | Method         | Handler                  | Lines | Pattern        |
| ------------------------------------- | -------------- | ------------------------ | ----- | -------------- |
| `/api/associations`                   | GET/POST       | List/create associations | 171   | Large endpoint |
| `/api/associations/[id]`              | GET/PUT/DELETE | Association details      | 115   |                |
| `/api/associations/stats/[profileId]` | GET            | Association stats        | -     |                |

### Social Routes

| Route                        | Method | Handler       | Lines | Pattern            |
| ---------------------------- | ------ | ------------- | ----- | ------------------ |
| `/api/social/follow`         | POST   | Follow user   | 90    | Consistent pattern |
| `/api/social/unfollow`       | POST   | Unfollow user | -     | Consistent pattern |
| `/api/social/followers/[id]` | GET    | Get followers | -     | Consistent pattern |
| `/api/social/following/[id]` | GET    | Get following | -     | Consistent pattern |

### Utility Routes

| Route                           | Method | Handler           | Lines | Notes                              |
| ------------------------------- | ------ | ----------------- | ----- | ---------------------------------- |
| `/api/health`                   | GET    | Health check      | -     | Simple                             |
| `/api/upload`                   | POST   | File upload       | 114   | Complex validation                 |
| `/api/transparency/[profileId]` | GET    | Transparency info | 92    |                                    |
| `/api/transactions`             | GET    | Transactions      | 227   | **LARGE** - Complex business logic |
| `/api/onboarding/analyze`       | POST   | Onboarding AI     | 147   |                                    |

---

## ERROR HANDLING PATTERN ANALYSIS

### Pattern 1: Manual (Organizations route)

```typescript
// /api/organizations/route.ts
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  // Custom rate limit implementation
}

if (!checkRateLimit(rateLimitId)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}

if (error) {
  logger.error('Error:', error);
  return NextResponse.json({ error: 'Failed...' }, { status: 500 });
}

return NextResponse.json(
  {
    success: true,
    data: organizations || [],
  },
  { status: 200 }
);
```

**Issues:**

- No consistency across routes
- Manual rate limiting (not scalable)
- Inline error messages

---

### Pattern 2: Helper Functions (Projects route)

```typescript
// /api/projects/route.ts
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';

const rateLimitResult = rateLimit(request);
if (!rateLimitResult.success) {
  return createRateLimitResponse(rateLimitResult);
}

if (error) {
  return apiInternalError('Failed to fetch projects', { details: error.message });
}

return apiSuccess(projects || []);
```

**Issues:**

- Uses helper functions but inconsistently
- 2 different response patterns in same codebase
- Some routes use Pattern 1, some use Pattern 2

---

### Pattern 3: Error Handler Wrapper (lib/api/errorHandling.ts)

- 356 lines of error handling abstraction
- Never fully adopted across routes
- Creates confusion about which pattern to use

---

## DUPLICATE ROUTE PAIRS

### 1. Projects/Campaigns Routes

```
/api/organizations/manage/projects/          (166 lines - GET/POST)
/api/organizations/manage/projects/campaigns/ (146 lines - GET/POST)
```

**Analysis:**

- Both query 'projects' table
- Different fields selected
- Same database operations
- **Action:** Consolidate or clarify intent

### 2. User Project Routes

```
/api/profiles/[userId]/projects/             (113 lines)
/api/profiles/[userId]/projects/campaigns/   (108 lines)
```

**Analysis:**

- Nearly identical line counts
- Likely duplicate queries
- **Action:** Remove one

### 3. Organization Creation

```
/api/organizations                            (312 lines - includes POST)
/api/organizations/create                     (173 lines - standalone POST)
```

**Analysis:**

- Both handle organization creation
- Can be consolidated into one
- **Action:** Remove /create endpoint

---

## RATE LIMITING INCONSISTENCY

### Current Implementation

1. **Organizations route:** Custom in-memory Map
   - Resets every 60 seconds
   - 10 requests per minute limit
   - Only in one route

2. **Projects route:** Uses `/lib/rate-limit`
   - Different implementation
   - Different config?
   - More routes should use this

3. **Other routes:** No rate limiting
   - Security risk
   - Inconsistent protection

**Action:** Enforce rate limiting globally via middleware

---

## RESPONSE INCONSISTENCY

### Successful Response Formats

```typescript
// Type 1: organizations/route.ts
{ success: true, data: [...], count: 5 }

// Type 2: projects/route.ts
[...] // Just the array

// Type 3: social/route.ts
{ success: true, followers: [...], total: 5 }
```

**Result:** Clients must handle 3 different response shapes

---

## LARGE ROUTE RECOMMENDATIONS

### /api/organizations/route.ts (312 lines)

**Issues:**

1. Duplicate /api/organizations/create
2. Manual rate limiting
3. Manual error handling
4. Manual auth checks
5. Complex search parameter parsing

**Refactor to:**

1. Remove /create endpoint
2. Use global middleware for rate limiting
3. Use standardResponse helpers
4. Extract search parsing to utility

**Estimated reduction:** 312 → 150 lines

---

### /api/transactions/route.ts (227 lines)

**Issues:**

1. Complex business logic in route
2. Multiple database queries
3. Manual rate limiting
4. No error handling wrapper

**Refactor to:**

1. Extract to service: `TransactionService`
2. Route just calls service
3. Use error handling helpers
4. Implement middleware rate limiting

**Estimated reduction:** 227 → 80 lines

---

## MISSING/NEEDED ROUTES

### Gaps Identified

1. No bulk operation endpoint (batch create projects)
2. No search consolidation endpoint (unified search)
3. No analytics aggregation endpoint
4. No export endpoint (CSV/JSON data export)
5. No webhook endpoints
6. No pagination consistency across routes

---

## STANDARDS TO IMPLEMENT

### 1. Response Format

```typescript
// All routes return this
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, any>;
  meta?: {
    timestamp: string;
    path: string;
    status: number;
  };
}
```

### 2. Error Handling

```typescript
// All routes use this
try {
  const result = await operation();
  return apiSuccess(result);
} catch (error) {
  return handleApiError(error); // Centralized
}
```

### 3. Rate Limiting

```typescript
// All routes use middleware
import { withRateLimit } from '@/lib/middleware/rateLimit';

export const GET = withRateLimit(async request => {
  // Handler code
});
```

### 4. Authentication

```typescript
// All routes use helper
import { withAuth } from '@/lib/api/withAuth';

export const POST = withAuth(async (request, user) => {
  // Handler code - user guaranteed
});
```

---

## CONSOLIDATION CHECKLIST

- [ ] Merge /organizations and /organizations/create
- [ ] Merge /organizations/manage/projects/\* into single route with query params
- [ ] Merge /profiles/[userId]/projects/\* into single route
- [ ] Standardize all responses to ApiResponse<T>
- [ ] Move all rate limiting to middleware
- [ ] Move all error handling to helpers
- [ ] Extract complex business logic to services
- [ ] Add missing endpoints (bulk ops, search, etc.)
- [ ] Document all routes in OpenAPI/Swagger
- [ ] Add request/response validation middleware
- [ ] Implement consistent pagination
- [ ] Add request logging middleware
- [ ] Add performance monitoring
- [ ] Add API versioning strategy
