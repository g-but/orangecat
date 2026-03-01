# OrangeCat

@~/.claude/CLAUDE.md

---

## Mission & Vision

**Mission**: Enable anyone — any person, pseudonym, or organization — to participate in the full spectrum of economic and governance activity: exchanging, funding, lending, investing, and governing, with any counterparty, in any currency, without gatekeepers.

**Vision**: A world where economic participation is as open and uncensorable as speech. Where any identity — human, pseudonymous, or AI — can earn, fund, lend, invest, and govern freely. Where AI agents work on behalf of people and organizations to make this effortless, and where every economic relationship is structured, transparent where appropriate, and private where it matters.

**What OrangeCat is (one sentence)**: Your AI economic agent — and the platform where it operates.

### Core Principles (derive every product and engineering decision from these)

1. **The Cat is the interface** — "My Cat" is the primary AI agent for every user and group. Entities provide structured context the Cat reads and operates on. Build for the Cat first.
2. **Pseudonymous by default** — real identity is opt-in, never required. Any pseudonymous actor is a full economic participant.
3. **Any currency** — Bitcoin/Lightning is native and preferred, but any payment method — local or global (Twint, PayPal, Venmo, Monero, and regional equivalents worldwide) — is a first-class citizen. Meet users where they are.
4. **Full economic spectrum** — from gift (no strings) to loan (some strings) to investment (more strings). All forms of value coordination belong on this platform. Investments are the current gap.
5. **Private where needed, transparent where chosen** — E2E encrypted messaging, Nostr as the censorship-resistant layer, Bitcoin's on-chain transparency available when appropriate.
6. **Entities are the Cat's world model** — every entity type represents a form of economic or governance activity. The richer the entity structure, the smarter the Cat can be.

### Entity Economic Taxonomy

| Category               | Entities                  | Finance Type               |
| ---------------------- | ------------------------- | -------------------------- |
| Exchange               | product, service          | Market transaction         |
| Funding (no strings)   | cause, wishlist, research | Donation/gift              |
| Funding (soft strings) | project                   | Milestone accountability   |
| Lending                | loan                      | Repayment expected         |
| Investing              | _(missing — to be built)_ | Return/equity expected     |
| Assets                 | asset                     | Collateral, rental         |
| Governance             | group, circle             | Collective decisions       |
| AI services            | ai_assistant              | Automated economic actor   |
| Events                 | event                     | Time-bound coordination    |
| Cat context            | document                  | Structured context for Cat |

### What This Means for Development

- When adding features, ask: does this serve the Cat, or does it serve a human manually? Prefer both.
- Payment fields should support any payment method, not just Bitcoin addresses.
- "Wallet" is a subset of "payment methods" — a user may have Lightning, Monero, PayPal, and Twint all as valid receiving options.
- Messaging should be built with E2E encryption and Nostr integration in mind, even if not yet implemented.
- Entities missing from the registry (`investment`) should be added as the platform matures.

---

## Overview

**OrangeCat** is an AI-native platform for universal economic and governance participation. The central product is "My Cat" — an AI agent that manages economic activity for each user and group, operating within a structured ecosystem of entities (products, services, projects, causes, loans, events, assets, groups, and more).

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
| Bitcoin    | Lightning Network, BTCPay, NWC     |
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

**Supported Entities** (see Entity Economic Taxonomy in Mission section above):

- `product` - Physical/digital goods (exchange)
- `service` - Professional services (exchange)
- `project` - Fundraising with accountability (soft-strings funding)
- `cause` - Charitable/no-strings funding
- `research` - Decentralized science funding
- `wishlist` - Gift registries
- `event` - Time-bound coordination
- `loan` - Peer-to-peer lending
- `asset` - Real estate, collateral, rentable assets
- `ai_assistant` - Autonomous AI economic actors
- `group` - Organizations with shared wallets and governance
- `circle` - Lighter community structures
- `document` - Structured context for the Cat
- `investment` - _(planned)_ Equity/revenue-share investing

**Adding New Entity**:

1. Add to `src/config/entity-registry.ts`
2. Create schema in `src/lib/validation.ts`
3. Create database migration via MCP

---

## Critical: Bitcoin Rules

### Bitcoin amounts: BTC is the canonical unit

Store Bitcoin amounts as BTC using `NUMERIC`/`DECIMAL` in the database.

```typescript
// DB column: NUMERIC(18, 8)  — exact decimal, no float errors
// e.g., 0.001 BTC stored as 0.00100000
const price_btc = 0.001; // ✅ BTC is the canonical unit
```

**Display**: Show BTC by default, or the user's chosen currency (CHF default). Use `useDisplayCurrency()` hook in components.

### Payment Methods Are Universal

Bitcoin/Lightning is native and preferred, but the platform supports any payment method. Use `payment_methods` concepts (not just "wallet") where possible.

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
- Use any unit other than BTC for Bitcoin storage (always `NUMERIC(18,8)`)
- Bypass `useDisplayCurrency()` for amount display — always use it
- Use Bitcoin Orange for non-Bitcoin UI
- Query by `user_id` (use `actor_id`)
- Run local Supabase (use remote)
- Edit `.env.local` without backup

---

**Last Updated**: 2026-01-23
