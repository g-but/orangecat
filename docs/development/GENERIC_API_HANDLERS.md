# Generic API Handlers Guide

**Created:** 2025-01-28  
**Last Modified:** 2025-01-28  
**Last Modified Summary:** Initial creation of generic API handlers guide

## 🎯 Overview

Generic API handlers eliminate duplication across entity routes, following our modularity philosophy. They provide consistent patterns while allowing customization where needed.

## 📚 Available Handlers

### 1. `createEntityListHandler` - GET Routes

Handles pagination, filtering, draft visibility, and caching for entity list endpoints.

**Usage:**
```typescript
import { createEntityListHandler } from '@/lib/api/entityListHandler';

export const GET = createEntityListHandler({
  entityType: 'event',
  publicStatuses: ['published', 'open', 'full'],
  draftStatuses: ['draft', 'published', 'open'],
  orderBy: 'start_date',
  orderDirection: 'asc',
  additionalFilters: {
    event_type: 'event_type', // Map query param to field
  },
  useListHelper: false, // Use listEntitiesPage for commerce entities
});
```

**Configuration Options:**
- `entityType` - Entity type from registry (required)
- `tableName` - Override table name (optional, uses registry)
- `publicStatuses` - Status values for public listings (default: `['active']`)
- `draftStatuses` - Status values including drafts (default: includes `'draft'`)
- `orderBy` - Field to order by (default: `'created_at'`)
- `orderDirection` - `'asc'` or `'desc'` (default: `'desc'`)
- `additionalFilters` - Map query params to fields (optional)
- `useListHelper` - Use `listEntitiesPage` for commerce entities (default: `false`)

**What It Handles Automatically:**
- ✅ Pagination (limit/offset from query params)
- ✅ Category filtering
- ✅ User filtering
- ✅ Draft visibility (shows drafts for own user)
- ✅ Cache control (private for user queries, public for general)
- ✅ Error handling
- ✅ Rate limiting

### 2. `createEntityPostHandler` - POST Routes

Handles auth, rate limiting, validation, and database insertion for entity creation.

**Usage:**
```typescript
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { eventSchema } from '@/lib/validation';

export const POST = createEntityPostHandler({
  entityType: 'event',
  schema: eventSchema,
  transformData: (data, userId) => ({
    ...data,
    user_id: userId,
    start_date: typeof data.start_date === 'string' 
      ? data.start_date 
      : data.start_date?.toISOString(),
  }),
  defaultFields: {
    current_attendees: 0,
  },
});
```

**Configuration Options:**
- `entityType` - Entity type from registry (required)
- `schema` - Zod validation schema (required)
- `tableName` - Override table name (optional, uses registry)
- `transformData` - Function to transform data before insert (optional)
- `createEntity` - Custom creation function (optional, for domain services)
- `defaultFields` - Additional fields to set on insert (optional)

**What It Handles Automatically:**
- ✅ Authentication check
- ✅ Rate limiting
- ✅ Zod validation
- ✅ Database insertion
- ✅ Error handling
- ✅ Logging

**For Entities Using Domain Services:**
```typescript
export const POST = createEntityPostHandler({
  entityType: 'product',
  schema: userProductSchema,
  createEntity: async (userId, data, supabase) => {
    return await createProduct(userId, data, supabase);
  },
});
```

### 3. `createEntityCrudHandlers` - [id] Routes

Handles GET, PUT, DELETE for individual entity endpoints. (Already exists)

**Usage:**
```typescript
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import { createUpdatePayloadBuilder } from '@/lib/api/buildUpdatePayload';

const buildUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description' },
  { from: 'status', default: 'draft' },
]);

const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'event',
  schema: eventSchema,
  buildUpdatePayload,
});

export { GET, PUT, DELETE };
```

## 📊 Impact

### Before Generic Handlers

**Events Route:**
- GET: ~70 lines
- POST: ~60 lines
- **Total: ~130 lines**

### After Generic Handlers

**Events Route:**
- GET: ~10 lines (configuration)
- POST: ~20 lines (configuration + transform)
- **Total: ~30 lines**

**Reduction: ~100 lines (77% reduction)**

## 🎯 When to Use

### Use Generic Handlers When:
- ✅ Entity follows standard patterns
- ✅ Standard pagination/filtering needed
- ✅ Standard auth/rate limiting needed
- ✅ Standard validation needed

### Use Custom Handlers When:
- ❌ Entity has complex business logic
- ❌ Entity needs special query patterns
- ❌ Entity has non-standard validation
- ❌ Entity requires domain service layer

## 🔄 Migration Guide

### Step 1: Identify the Pattern
Look at your current route - does it follow the standard pattern?

### Step 2: Choose the Handler
- List endpoint? → `createEntityListHandler`
- Create endpoint? → `createEntityPostHandler`
- Detail/Update/Delete? → `createEntityCrudHandlers`

### Step 3: Extract Configuration
- What's entity-specific? → Configuration
- What's standard? → Handled automatically

### Step 4: Refactor
Replace the route implementation with handler configuration.

### Step 5: Test
Verify the route works the same way.

## 📝 Examples

### Example 1: Simple Entity (Events)
```typescript
// GET - Simple list
export const GET = createEntityListHandler({
  entityType: 'event',
  orderBy: 'start_date',
  orderDirection: 'asc',
});

// POST - Simple create with date transformation
export const POST = createEntityPostHandler({
  entityType: 'event',
  schema: eventSchema,
  transformData: (data, userId) => ({
    ...data,
    user_id: userId,
    start_date: normalizeDate(data.start_date),
  }),
});
```

### Example 2: Commerce Entity (Products)
```typescript
// GET - Uses listEntitiesPage helper
export const GET = createEntityListHandler({
  entityType: 'product',
  useListHelper: true, // Uses listEntitiesPage
});

// POST - Uses domain service
export const POST = createEntityPostHandler({
  entityType: 'product',
  schema: userProductSchema,
  createEntity: async (userId, data, supabase) => {
    return await createProduct(userId, data, supabase);
  },
});
```

### Example 3: Entity with Custom Filters
```typescript
export const GET = createEntityListHandler({
  entityType: 'event',
  additionalFilters: {
    event_type: 'event_type', // ?event_type=meetup → WHERE event_type = 'meetup'
    venue_city: 'city',        // ?city=Zurich → WHERE venue_city = 'Zurich'
  },
});
```

## 🚀 Benefits

1. **Less Code** - ~70% reduction in route code
2. **Consistency** - All entities behave the same way
3. **Maintainability** - Fix bugs once, works everywhere
4. **Type Safety** - Full TypeScript support
5. **Easy to Add** - New entities = configuration, not code

## 🔗 Related

- [Entity Registry](../architecture/ENTITY_REGISTRY.md)
- [Modularity Philosophy](../architecture/MODULARITY_PHILOSOPHY.md)
- [Engineering Principles](./ENGINEERING_PRINCIPLES.md)



