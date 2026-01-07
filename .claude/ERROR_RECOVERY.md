# Error Recovery Playbook

**Purpose**: Common errors and step-by-step fixes - minimize downtime, maximize recovery speed

**Last Updated**: 2026-01-06

---

## 🚨 Critical Errors (Fix Immediately)

### .env.local Missing or Corrupted

**Symptoms**:
- MCP tools fail
- Supabase connection errors
- "Cannot find module" errors for env vars

**Fix**:
```bash
# 1. Check if file exists
ls -la .env.local

# 2. If missing, restore from backup
node scripts/utils/env-manager.js restore

# 3. If no backup, user must manually recreate
# (Claude cannot create this - contains secrets)
```

**Prevention**:
- **NEVER** delete .env.local (see `.claude/RULES.md`)
- Always backup before changes: `node scripts/utils/env-manager.js backup`

---

### Type Check Failing After Edit

**Symptoms**:
- Post-hook shows type errors
- `npm run type-check` fails
- Red squiggles in IDE

**Fix**:
```bash
# 1. Read error carefully (post-hook shows it)
# Example: "Property 'warranty_period' does not exist on type 'Product'"

# 2. Identify root cause
grep -r "warranty_period" src/

# 3. Fix options:
# Option A: Add to type definition
# src/types/product.ts
export interface Product {
  // ... existing fields
  warranty_period?: number;  // Add this
}

# Option B: Add to Zod schema (if derived from schema)
# src/lib/validation.ts
export const productSchema = baseEntitySchema.extend({
  // ... existing fields
  warranty_period: z.number().optional(),  // Add this
});

# 4. Verify fix
npm run type-check
```

**Prevention**:
- Always update type definitions when adding fields
- Use Zod schemas (types auto-derive)

---

### Migration Failed

**Symptoms**:
- `mcp_supabase_apply_migration()` returns error
- Database operation fails
- SQL syntax error

**Fix**:
```bash
# 1. Check error message
# Example: "column 'warranty_period' already exists"

# 2. Check current schema
mcp_supabase_execute_sql({ 
  query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_products'" 
})

# 3. Fix migration
# If column exists, use IF NOT EXISTS:
ALTER TABLE user_products 
ADD COLUMN IF NOT EXISTS warranty_period INTEGER;

# If constraint conflict, drop and recreate:
ALTER TABLE user_products 
DROP CONSTRAINT IF EXISTS check_price_positive;
ALTER TABLE user_products 
ADD CONSTRAINT check_price_positive CHECK (price_sats > 0);

# 4. Apply corrected migration
mcp_supabase_apply_migration({ 
  name: 'fix_warranty_field', 
  query: '...' 
})
```

**Prevention**:
- Always check schema before migration
- Use `IF NOT EXISTS` / `IF EXISTS` clauses
- Test on development database first

---

## ⚠️ Common Errors (Fix Soon)

### Entity Registry Not Being Used

**Symptoms**:
- Post-hook detects hardcoded entity names
- Error: "Hardcoded entity names found"

**Fix**:
```typescript
// ❌ Before
const { data } = await supabase.from('user_products').select('*');
const endpoint = '/api/products';

// ✅ After
import { ENTITY_REGISTRY } from '@/config/entity-registry';

const meta = ENTITY_REGISTRY.product;
const { data } = await supabase.from(meta.tableName).select('*');
const endpoint = meta.apiEndpoint;
```

**Prevention**:
- Always import and use ENTITY_REGISTRY
- Pre-hook will catch violations

---

### RLS Policy Blocking Query

**Symptoms**:
- Query returns empty (but data exists)
- Error: "PGRST116 - Row not found"
- User can't see their own data

**Fix**:
```bash
# 1. Check RLS policies
mcp_supabase_execute_sql({ 
  query: "SELECT * FROM pg_policies WHERE tablename = 'user_products'" 
})

# 2. Verify user context
# Check if actor_id is correct
mcp_supabase_execute_sql({ 
  query: "SELECT id, user_id FROM actors WHERE user_id = '<user_uuid>'" 
})

# 3. Fix options:
# Option A: Fix policy if wrong
# Create migration to update policy

# Option B: Fix query if using wrong actor_id
const actor = await getUserActor(userId);  // Correct
const { data } = await supabase
  .from('user_products')
  .select('*')
  .eq('actor_id', actor.id);  // Use actor.id, not user.id
```

**Prevention**:
- Always use actor_id (not user_id directly)
- Test queries with different users

---

### Browser Automation Timeout

**Symptoms**:
- `mcp_cursor-ide-browser_*` times out
- Element not found
- Page doesn't load

**Fix**:
```typescript
// 1. Verify dev server running
// Check: lsof -i :3001

// 2. Start dev server if needed
// npm run dev

// 3. Increase timeouts
await mcp_cursor-ide-browser_browser_wait_for({ 
  text: 'Expected text',
  timeout: 10000  // 10 seconds instead of default
});

// 4. Try multiple selectors
await mcp_cursor-ide-browser_browser_click({ 
  element: 'Submit button', 
  ref: 'button[type="submit"], button:has-text("Submit"), [data-testid="submit"]'
});

// 5. Take snapshot to see current state
const snapshot = await mcp_cursor-ide-browser_browser_snapshot();
// Analyze snapshot to find correct selector
```

**Prevention**:
- Always verify dev server first
- Use multiple selector strategies
- Wait for elements before interacting

---

### Build Failing

**Symptoms**:
- `npm run build` fails
- Type errors in production build
- Module not found errors

**Fix**:
```bash
# 1. Clear cache
rm -rf .next

# 2. Reinstall dependencies (if package.json changed)
npm install

# 3. Check type errors
npm run type-check

# 4. Check lint errors
npm run lint

# 5. Fix errors and rebuild
npm run build

# 6. If still failing, check specific error
# Common: Missing environment variables in build
# Solution: Add to Vercel dashboard
```

**Prevention**:
- Always run `npm run type-check` before committing
- Use `/deploy-check` command before deployment
- Keep dependencies updated

---

## 🔧 Recovery Workflows

### Complete Recovery from Bad State

```bash
# 1. Check git status
git status

# 2. If changes are bad, stash or reset
git stash  # Save changes
# or
git reset --hard HEAD  # Discard changes

# 3. Clean build artifacts
rm -rf .next node_modules

# 4. Fresh install
npm install

# 5. Verify environment
ls -la .env.local  # Should exist

# 6. Test basic operations
npm run type-check
npm run lint
npm run build

# 7. If all pass, start dev server
npm run dev
```

---

### Database Recovery (If Schema Broken)

```bash
# 1. Check current migrations
mcp_supabase_list_migrations()

# 2. If last migration is bad, create rollback migration
mcp_supabase_apply_migration({ 
  name: 'rollback_bad_change', 
  query: 'ALTER TABLE ... DROP COLUMN ...' 
})

# 3. Verify schema
mcp_supabase_execute_sql({ 
  query: "\\d user_products" 
})

# 4. Re-apply correct migration
mcp_supabase_apply_migration({ 
  name: 'correct_change', 
  query: '...' 
})
```

---

### Tool Access Recovery

**If MCP tools stop working**:

```bash
# 1. Check .mcp.json exists
ls -la .mcp.json

# 2. Check .claude/settings.local.json
ls -la .claude/settings.local.json

# 3. Verify permissions in settings
# Should have entries for mcp_supabase_*, mcp_cursor-ide-browser_*, etc.

# 4. Test simple operation
mcp_supabase_execute_sql({ query: 'SELECT NOW()' })

# 5. If fails, restart Cursor
# File → Quit → Reopen
```

---

## 📋 Diagnostic Checklist

### When Something Isn't Working

**Check these in order**:

1. **Environment**:
   - [ ] `.env.local` exists
   - [ ] Dev server running (if testing UI)
   - [ ] Correct Node version (check `.nvmrc`)

2. **Code Quality**:
   - [ ] Type check passes (`npm run type-check`)
   - [ ] Lint passes (`npm run lint`)
   - [ ] No console.logs in production code

3. **Database**:
   - [ ] Migrations applied
   - [ ] RLS policies correct
   - [ ] Connection working (test with simple query)

4. **Dependencies**:
   - [ ] `node_modules` exists
   - [ ] No conflicting versions
   - [ ] All peer dependencies installed

5. **Build**:
   - [ ] `.next/` directory exists
   - [ ] Build completes without errors
   - [ ] No missing environment variables

---

## 🎯 Quick Fixes by Error Message

| Error Message | Likely Cause | Quick Fix |
|---------------|--------------|-----------|
| "Cannot find module '@/...'" | Missing dependency or tsconfig path issue | `npm install` or check tsconfig.json |
| "PGRST116" | RLS policy blocking | Check RLS policies, verify actor_id |
| "Type '...' is not assignable" | Type mismatch | Update schema or add type assertion |
| "ECONNREFUSED" | Service not running | Start dev server or check Supabase connection |
| "Module not found: Can't resolve 'fs'" | Server module imported in client | Add webpack fallback or move to server |
| "Hydration failed" | Server/client mismatch | Check for date formatting or random values |
| "Too many re-renders" | Infinite loop in useEffect | Add dependency array or condition |
| "Invalid hook call" | Hooks used outside component | Move hooks inside component body |

---

## 🔗 Related Resources

- **Main Guide**: `.claude/CLAUDE.md`
- **Quick Reference**: `.claude/QUICK_REFERENCE.md`
- **Credentials**: `.claude/CREDENTIALS.md`
- **Protection Rules**: `.claude/RULES.md`

---

**Remember**: Most errors have simple fixes. Check environment first, then code, then database. Use MCP tools to diagnose database issues. Post-hooks catch many errors automatically.
