# OrangeCat

@~/.claude/CLAUDE.md

---

## Overview

**OrangeCat** is a Bitcoin-native marketplace platform featuring Lightning Network payments, sats-only pricing, and multi-entity commerce.

**Project Path**: `/home/g/dev/orangecat`

```bash
cd /home/g/dev/orangecat
npm run dev -- -p 3020  # Port 3020 to avoid conflicts
```

---

## Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 15 (App Router)            |
| Language   | TypeScript 5.8                     |
| Styling    | Tailwind CSS 3.3                   |
| Database   | Supabase (PostgreSQL + Auth + RLS) |
| Bitcoin    | Lightning Network, sats-only       |
| Deployment | Vercel                             |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   └── api/               # API routes (thin wrappers)
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── config/
│   └── entity-registry.ts # SSOT for all entities
├── domain/                # Business logic (no HTTP/UI)
├── lib/
│   ├── api/              # API middleware, responses
│   ├── bitcoin/          # Lightning, sats formatting
│   ├── supabase/         # Client creation
│   └── validation.ts     # Zod schemas
└── hooks/                 # Data fetching hooks
```

---

## Critical: Entity Registry Pattern

**SSOT Location**: `src/config/entity-registry.ts`

```typescript
// ALWAYS use registry, NEVER hardcode
const meta = ENTITY_REGISTRY[entityType];
const table = meta.tableName; // NOT 'user_products'
const path = meta.basePath; // NOT '/dashboard/store'
```

**Supported Entities**:

- `product` - Physical/digital goods
- `service` - Professional services
- `project` - Fundraising projects
- `cause` - Charitable causes
- `event` - Events/meetups
- `loan` - Peer-to-peer lending
- `asset` - Real estate, assets
- `ai_assistant` - AI chatbots

**Adding New Entity**:

1. Add to `src/config/entity-registry.ts`
2. Create schema in `src/lib/validation.ts`
3. Create database migration via MCP

---

## Critical: Bitcoin Rules

### Satoshis ONLY

```typescript
// CORRECT - always sats (integer)
const price_sats = 100000; // 0.001 BTC
formatSats(100000); // "100,000 sats"

// WRONG - never BTC floats (precision errors!)
const price_btc = 0.001; // NO!
```

### Bitcoin Orange (#F7931A)

**ONLY for Bitcoin-related UI**:

- Bitcoin balance displays
- Lightning Network indicators
- Bitcoin icons

**NEVER for general UI elements**.

---

## Critical: Actor System

Everything is owned by an Actor (users AND groups have actors).

```typescript
// CORRECT - query by actor_id
const { data } = await supabase
  .from(meta.tableName)
  .select('*')
  .eq('actor_id', actorId);

// WRONG - don't query by user_id directly
.eq('user_id', userId);  // NO!
```

---

## Critical: Remote-Only Supabase

**NO local Supabase** - always use remote instance.

```bash
# Credentials in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# DON'T use these:
npx supabase start   # Won't work
npx supabase stop    # Won't work
```

**Use MCP tools instead**:

```typescript
mcp_supabase_list_tables();
mcp_supabase_execute_sql();
mcp_supabase_apply_migration();
```

---

## API Pattern

**Thin API routes** - delegate to domain services:

```typescript
// app/api/products/route.ts
export async function POST(request: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError('Unauthorized', 401);

  const body = await request.json();
  const commerce = new CommerceService(supabase);
  const product = await commerce.createProduct(body, actorId);

  return apiSuccess({ data: product }, 201);
}
```

---

## Design System

| Element | Value                            |
| ------- | -------------------------------- |
| Primary | Tiffany Blue `#0ABAB5`           |
| Accent  | Orange `#FF6B35`                 |
| Bitcoin | Orange `#F7931A` (Bitcoin-only!) |

---

## Protected Files

**Never modify without backup**:

- `.env.local` - credentials
- `supabase/migrations/*` - immutable once applied
- `src/config/entity-registry.ts` - requires full understanding

---

## Quick Reference

| File                         | Purpose               |
| ---------------------------- | --------------------- |
| `.claude/QUICK_REFERENCE.md` | Common operations     |
| `.claude/CREDENTIALS.md`     | Where credentials are |
| `.claude/rules/`             | All best practices    |

---

## Don't

- Hardcode entity names (use `ENTITY_REGISTRY`)
- Store prices in BTC (use sats)
- Use Bitcoin Orange for non-Bitcoin UI
- Query by `user_id` (use `actor_id`)
- Run local Supabase (use remote)
- Edit `.env.local` without backup

---

**Last Updated**: 2026-01-23
