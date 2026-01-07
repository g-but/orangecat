# Quick Reference Card

**Purpose**: One-page lookup for common operations - maximize speed and efficiency

---

## 🚀 Common Workflows

### Add New Entity Type
```bash
1. Update src/config/entity-registry.ts
2. Create validation schema in src/lib/validation.ts
3. mcp_supabase_apply_migration({ name: "create_user_newtype", query: "CREATE TABLE..." })
4. Test with browser automation
```

### Fix Type Error
```bash
1. Read error from post-hook stderr
2. Locate file and line number
3. Check schema definitions
4. Update types or add to schema
5. Verify with npm run type-check
```

### Create Migration
```typescript
mcp_supabase_apply_migration({
  name: "add_field_name",
  query: `
    ALTER TABLE user_products 
    ADD COLUMN new_field TEXT;
    CREATE INDEX idx_user_products_new_field 
    ON user_products(new_field);
  `
})
```

### Test UI Change
```javascript
// Navigate
mcp_cursor-ide-browser_browser_navigate({ url: 'http://localhost:3001/page' })

// Snapshot
mcp_cursor-ide-browser_browser_snapshot()

// Interact
mcp_cursor-ide-browser_browser_click({ element: 'Button', ref: 'button[data-testid="submit"]' })

// Verify
mcp_cursor-ide-browser_browser_wait_for({ text: 'Success message' })
```

---

## 🎯 Decision Tree

### "Where should this code go?"
```
Is it HTTP-related?
├─ Yes → app/api/ (thin wrapper)
└─ No → Is it business logic?
    ├─ Yes → src/domain/[domain]/service.ts
    └─ No → Is it UI?
        ├─ Yes → src/components/
        └─ No → src/lib/ or src/hooks/
```

### "Which tool should I use?"
```
Need to query database?
├─ Use mcp_supabase_execute_sql()

Need to create table/migration?
├─ Use mcp_supabase_apply_migration()

Need to test UI?
├─ Use mcp_cursor-ide-browser_*

Need library docs?
├─ Use mcp_context7_query-docs()

Need to find code?
├─ Use grep for exact matches
└─ Use codebase_search for semantic search
```

### "What validation approach?"
```
API input?
├─ Use Zod schema validation
└─ Return apiValidationError() on failure

User input (form)?
├─ Use React Hook Form + Zod resolver
└─ Show inline errors with FormMessage

Database constraint?
├─ Define in migration (NOT NULL, CHECK, etc.)
└─ Let database enforce
```

---

## 🔧 Tool Quick Reference

### Supabase MCP
```typescript
// List tables
mcp_supabase_list_tables({ schemas: ['public'] })

// Run query
mcp_supabase_execute_sql({ 
  query: 'SELECT * FROM user_products WHERE actor_id = $1 LIMIT 10'
})

// Create migration
mcp_supabase_apply_migration({ 
  name: 'migration_name', 
  query: 'SQL here' 
})

// Security check
mcp_supabase_get_advisors({ type: 'security' })

// Performance check
mcp_supabase_get_advisors({ type: 'performance' })
```

### Browser Automation MCP
```typescript
// Navigate
mcp_cursor-ide-browser_browser_navigate({ 
  url: 'http://localhost:3001/dashboard' 
})

// Snapshot (better than screenshot)
mcp_cursor-ide-browser_browser_snapshot()

// Click
mcp_cursor-ide-browser_browser_click({ 
  element: 'Submit button', 
  ref: 'button[type="submit"]' 
})

// Type
mcp_cursor-ide-browser_browser_type({ 
  element: 'Title input', 
  ref: 'input[name="title"]', 
  text: 'Test value' 
})

// Wait
mcp_cursor-ide-browser_browser_wait_for({ 
  text: 'Success message' 
})
```

### Context7 (Documentation)
```typescript
// Find library
mcp_context7_resolve-library-id({ 
  libraryName: 'next.js', 
  query: 'user question' 
})

// Get docs
mcp_context7_query-docs({ 
  libraryId: '/vercel/next.js', 
  query: 'how to use server actions' 
})
```

---

## 📋 Code Patterns

### API Route (Generic Handler)
```typescript
// app/api/products/route.ts
import { createEntityCrudHandlers } from '@/lib/api/entityHandler';

const { GET, POST, PUT, DELETE } = createEntityCrudHandlers('product');
export { GET, POST, PUT, DELETE };
```

### API Route (Custom)
```typescript
import { compose } from '@/lib/api/compose';
import { withAuth, withRateLimit, withValidation } from '@/lib/api/middleware';

export const POST = compose(
  withAuth(),
  withRateLimit('write'),
  withValidation(schema),
)(async (request, context) => {
  const service = new Service(context.supabase);
  const result = await service.doSomething(context.validData);
  return apiSuccess({ data: result });
});
```

### Component with Form
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', price_sats: 0 },
  });

  const onSubmit = async (data) => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Handle response
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Database Query with RLS
```typescript
// ✅ Let RLS handle authorization
const { data, error } = await supabase
  .from('user_products')
  .select('id, title, price_sats')
  .eq('id', productId)
  .single();

// RLS automatically filters by user
```

---

## 🔍 Debugging Checklist

### Type Error
1. Read error message carefully
2. Check schema definition
3. Verify types match schema
4. Run `npm run type-check` to verify

### API Not Working
1. Check Supabase connection (credentials in .env.local)
2. Verify RLS policies
3. Check browser console for errors
4. Test with direct SQL query

### UI Not Rendering
1. Check browser console for errors
2. Verify data is loading (check Network tab)
3. Check component props
4. Test with browser automation

### Build Failing
1. Run `npm run type-check`
2. Run `npm run lint`
3. Check for missing dependencies
4. Clear `.next/` and rebuild

---

## 🚨 Common Errors & Fixes

### "Cannot find module '@/...'"
```bash
# Fix: Update tsconfig.json paths or install missing package
npm install <package-name>
```

### "PGRST116 - Row not found"
```
# Fix: Check RLS policies - user likely doesn't have access
mcp_supabase_execute_sql({ 
  query: "SELECT * FROM pg_policies WHERE tablename = 'table_name'" 
})
```

### "Type 'X' is not assignable to type 'Y'"
```typescript
// Fix: Update schema or add type assertion
const data: Y = schema.parse(input);
```

### "Module not found: Can't resolve 'fs'"
```
# Fix: Add to next.config.js
webpack: (config) => {
  config.resolve.fallback = { fs: false };
  return config;
}
```

---

## 📊 Entity Registry Usage

```typescript
// ✅ ALWAYS use registry
import { ENTITY_REGISTRY } from '@/config/entity-registry';

const meta = ENTITY_REGISTRY[entityType];

// Use for everything
meta.tableName      // 'user_products'
meta.name          // 'Product'
meta.namePlural    // 'Products'
meta.basePath      // '/dashboard/store'
meta.apiEndpoint   // '/api/products'
meta.icon          // Package (component)

// ❌ NEVER hardcode
'user_products'    // VIOLATION!
'/api/products'    // VIOLATION!
```

---

## 🎯 OrangeCat-Specific Patterns

### Bitcoin & Sats

```typescript
// ✅ Always use sats (smallest unit)
const price_sats = 100000;  // 0.001 BTC

// ✅ Display formatting
import { formatSats, formatBTC } from '@/lib/bitcoin';
formatSats(100000);    // "100,000 sats"
formatBTC(100000);     // "0.001 BTC"

// ❌ Never store in BTC (floating point errors!)
const price_btc = 0.001;  // WRONG!
```

### Actor System

```typescript
// ✅ Use actor_id (unified ownership)
const { data } = await supabase
  .from('user_products')
  .select('*')
  .eq('actor_id', actorId);  // ✅

// ❌ Don't use user_id directly
.eq('user_id', userId);      // ❌ WRONG!
```

### Lightning Network

```typescript
// ✅ Generate LNURL payment
import { generateLNURL } from '@/lib/bitcoin/lightning';
const lnurl = generateLNURL({
  amount_sats: 1000,
  description: 'Product purchase',
  callback_url: '/api/payments/callback',
});
```

### Terminology

```typescript
// ✅ Use correct terms
"funding"           // not "donations"
"supporters"        // not "donors"
"Bitcoin funding"   // not "Bitcoin donations"
"sats"             // not "bits"
"satoshis"         // not "sat"

// ❌ Wrong terms
"donate"           // ❌
"crypto"           // ❌ (say "Bitcoin")
```

### Common Workflows

#### Add New Entity Type
```bash
# 1. Add to entity registry
edit src/config/entity-registry.ts

# 2. Create validation schema
edit src/lib/validation.ts

# 3. Apply migration
mcp_supabase_apply_migration({
  name: "create_user_newentity",
  query: "CREATE TABLE user_newentity ..."
})

# 4. Everything else is automatic!
```

#### Create Bitcoin Payment
```typescript
// Generate LNURL
const lnurl = generateLNURL({
  amount_sats: product.price_sats,
  description: `Purchase: ${product.title}`,
});

// Show QR code to user
<QRCode value={lnurl} />
```

---

## 💾 Environment Variables

**Location**: `.env.local` (NEVER delete this file!)

**Required Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Access**:
```typescript
// Server-side only
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-safe
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

---

## 🎯 Quick Commands

```bash
# Health check
/audit

# Database check
/db-check

# Pre-deployment
/deploy-check

# Handoff
h

# Pickup
p

# Init session
/init
```

---

**Remember**: This is a quick reference. See detailed docs in `.claude/rules/` and `.claude/CLAUDE.md`.
