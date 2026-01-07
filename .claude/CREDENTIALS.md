# Credentials & Tool Access

**Purpose**: Document where credentials are stored and how to access tools

**Last Updated**: 2026-01-06

---

## 🔐 Critical File: .env.local

**Location**: `/home/g/dev/orangecat/.env.local`

**Status**: ✅ EXISTS (filtered from read access for security)

**Purpose**: Contains ALL credentials for:
- Supabase (database & auth)
- GitHub (version control)
- Vercel (deployment)
- MCP Servers (tool integrations)

**⚠️ CRITICAL RULES**:
- ❌ **NEVER** delete this file
- ❌ **NEVER** remove existing variables
- ✅ **CAN** add new variables
- ✅ **CAN** modify values if explicitly instructed
- ✅ Use `node scripts/utils/env-manager.js backup` before changes

---

## 🗄️ Supabase Credentials

**Stored in**: `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ohkueislstxomdjavyhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (public key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (private key)
```

**Access Methods**:

### 1. Via Environment Variables (Code)
```typescript
const supabase = createServerClient();
// Automatically uses NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY
```

### 2. Via MCP Supabase Tools
```typescript
// These tools use credentials from .mcp.json which references .env.local
mcp_supabase_list_tables()
mcp_supabase_execute_sql({ query: '...' })
mcp_supabase_apply_migration({ name: '...', query: '...' })
```

### 3. Via Direct psql (From settings.local.json)
```bash
# Connection string visible in settings.local.json permissions
PGPASSWORD="<service_role_key>" psql "postgresql://postgres.ohkueislstxomdjavyhs:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

---

## 🌐 MCP Server Configuration

**Location**: `.mcp.json` (project root)

**Purpose**: Configures MCP servers that provide tool access

**Available MCP Servers**:
- **supabase**: Database operations
- **cursor-ide-browser**: Browser automation
- **context7**: Library documentation
- **puppeteer**: Alternative browser automation
- **shadcn**: UI component documentation

**Permissions**: Stored in `.claude/settings.local.json`

---

## 🔧 Tool Access Methods

### Supabase Database

**Method 1: MCP Tools** (Preferred)
```typescript
// List tables
await mcp_supabase_list_tables({ schemas: ['public'] });

// Execute query
await mcp_supabase_execute_sql({ 
  query: 'SELECT * FROM user_products LIMIT 10' 
});

// Create migration
await mcp_supabase_apply_migration({ 
  name: 'add_field', 
  query: 'ALTER TABLE...' 
});

// Check security/performance
await mcp_supabase_get_advisors({ type: 'security' });
await mcp_supabase_get_advisors({ type: 'performance' });
```

**Method 2: Supabase Client** (In Code)
```typescript
import { createServerClient } from '@/lib/supabase/server';

const supabase = createServerClient();
const { data, error } = await supabase
  .from('user_products')
  .select('*')
  .limit(10);
```

**Method 3: Direct SQL** (For Complex Queries)
```bash
# Run via terminal (credentials from settings.local.json)
PGPASSWORD="<service_role_key>" psql "<connection_string>" -c "SELECT..."
```

---

### Browser Automation

**Method: MCP Browser Tools**
```typescript
// Navigate
await mcp_cursor-ide-browser_browser_navigate({ 
  url: 'http://localhost:3001/dashboard' 
});

// Snapshot (better than screenshot for actions)
await mcp_cursor-ide-browser_browser_snapshot();

// Click element
await mcp_cursor-ide-browser_browser_click({ 
  element: 'Submit button', 
  ref: 'button[type="submit"]' 
});

// Type into field
await mcp_cursor-ide-browser_browser_type({ 
  element: 'Title input', 
  ref: 'input[name="title"]', 
  text: 'Test value' 
});

// Wait for condition
await mcp_cursor-ide-browser_browser_wait_for({ 
  text: 'Success message' 
});
```

---

### Library Documentation

**Method: Context7 MCP**
```typescript
// Resolve library ID
const libs = await mcp_context7_resolve-library-id({ 
  libraryName: 'next.js', 
  query: 'user needs Next.js docs' 
});

// Query documentation
const docs = await mcp_context7_query-docs({ 
  libraryId: '/vercel/next.js', 
  query: 'how to use server actions with forms' 
});
```

---

## 🔍 Verifying Tool Access

### Check Supabase Connection
```typescript
// Test query
mcp_supabase_execute_sql({ 
  query: 'SELECT NOW() as current_time' 
})
// Should return current timestamp
```

### Check Browser Automation
```typescript
// Navigate to local dev server
mcp_cursor-ide-browser_browser_navigate({ 
  url: 'http://localhost:3001' 
})
// Should succeed if dev server running
```

### Check Context7
```typescript
// Search for React docs
mcp_context7_resolve-library-id({ 
  libraryName: 'react', 
  query: 'hooks' 
})
// Should return library IDs
```

---

## 🚨 Troubleshooting

### "MCP tool not available"
**Causes**:
- MCP server not configured in `.mcp.json`
- Permissions not granted in `.claude/settings.local.json`

**Fix**:
- Check `.mcp.json` for server configuration
- Check `.claude/settings.local.json` for permissions

### "Supabase connection failed"
**Causes**:
- `.env.local` missing or incorrect
- Credentials expired
- Network issue

**Fix**:
1. Verify `.env.local` exists (you can't read it, but it should exist)
2. Test with: `mcp_supabase_execute_sql({ query: 'SELECT 1' })`
3. If fails, user needs to check Supabase dashboard

### "Browser automation not working"
**Causes**:
- Dev server not running (localhost:3001)
- URL incorrect
- Element selectors changed

**Fix**:
1. Verify dev server: `lsof -i :3001`
2. Test navigation first: `mcp_cursor-ide-browser_browser_navigate({ url: 'http://localhost:3001' })`
3. Use snapshot to see current page state
4. Update selectors based on snapshot

---

## 📊 Credential Locations Summary

| Credential | Location | Access Method |
|------------|----------|---------------|
| Supabase URL | `.env.local` | `process.env.NEXT_PUBLIC_SUPABASE_URL` |
| Supabase Anon Key | `.env.local` | `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Supabase Service Key | `.env.local` | `process.env.SUPABASE_SERVICE_ROLE_KEY` |
| MCP Server Config | `.mcp.json` | Auto-loaded by Cursor |
| MCP Permissions | `.claude/settings.local.json` | Auto-loaded by Cursor |
| DB Connection String | `.env.local` & settings | psql or MCP tools |

---

## 🎯 Best Practices

1. **Always use MCP tools first**:
   - More convenient
   - Better error handling
   - Automatic credential management

2. **Use environment variables in code**:
   - Don't hardcode credentials
   - Use `process.env.*`

3. **Test tool access at session start**:
   - Run simple test query
   - Verify browser navigation
   - Confirms everything working

4. **Never expose credentials**:
   - Don't log them
   - Don't commit them
   - Don't put in error messages

---

## 🔗 Related Files

- **Main Guide**: `.claude/CLAUDE.md`
- **Environment Protection**: `.claude/RULES.md`
- **MCP Config**: `.mcp.json`
- **Permissions**: `.claude/settings.local.json`
- **Env Manager**: `scripts/utils/env-manager.js`

---

**Remember**: Credentials exist and work. Trust that `.env.local` contains everything needed. Use MCP tools for convenient access.
