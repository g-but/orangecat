# OrangeCat

Bitcoin transparency platform — commerce, funding, community, and AI, all powered by Bitcoin.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Live](https://img.shields.io/badge/Live-orangecat.ch-orange.svg)](https://orangecat.ch)
[![Bitcoin Only](https://img.shields.io/badge/Bitcoin-Only-F7931A.svg)](https://bitcoin.org)

## What It Does

- **Commerce**: Buy and sell products and services with Bitcoin (Lightning Network native)
- **Funding**: Transparent project funding, loans, and cause support — all on-chain accountability
- **Community**: Groups, events, wishlists, and shared ownership through an actor system
- **AI**: Integrated AI assistants as first-class entities, not bolted-on features
- **Research**: Document and knowledge management for Bitcoin-related research

## Architecture

This is the section that matters. OrangeCat is built on a handful of architectural decisions that eliminate entire categories of problems.

### Entity Registry Pattern (Single Source of Truth)

The centerpiece. One file — `src/config/entity-registry.ts` — defines 13 entity types: products, services, projects, causes, events, loans, assets, AI assistants, groups, wishlists, research, documents, and wallets.

This single registry drives CRUD operations, navigation, form generation, and validation across the entire application. Adding a new entity type requires changes to 2-3 files: registry, schema, and migration.

```typescript
// src/config/entity-registry.ts (concept)
export const ENTITY_REGISTRY = {
  products: {
    slug: 'products',
    labelDe: 'Produkte',
    schema: productSchema,
    icon: Package,
    features: ['commerce', 'images', 'variants'],
    crud: { list: true, create: true, edit: true, delete: true },
  },
  loans: {
    slug: 'loans',
    labelDe: 'Darlehen',
    schema: loanSchema,
    icon: Landmark,
    features: ['funding', 'repayment-schedule'],
    crud: { list: true, create: true, edit: true, delete: false },
  },
  // ... 11 more entity types, same shape
} as const;
```

Every UI component, API route, and form reads from this registry. No entity-specific switch statements scattered across the codebase. The registry is the truth; everything else derives from it.

### Middleware Composition

`src/lib/api/compose.ts` — functional composition for building complex API handlers from simple middleware.

```typescript
// Instead of duplicating auth + validation + rate limiting in 40+ routes:
export default compose(
  withAuth(),
  withRateLimit('write'),
  withValidation(schema)
)(handler);
```

Each middleware does one thing. Compose them for any combination. No inheritance, no base classes, no "AbstractAuthenticatedValidatedRateLimitedHandler".

### Generic Entity CRUD

`src/lib/api/entityCrudHandler.ts` — one handler implementation serves products, services, causes, events, loans, and assets. Eliminates 95% of CRUD code duplication. Entity-specific validation and business rules plug in through configuration, not subclassing.

### Response Standardization

`src/lib/api/responses.ts` — pre-configured error and success responses replacing 35+ instances of ad-hoc response construction. Every API route returns the same shape:

```typescript
// Success
{ success: true, data: {...}, meta?: { total, page } }

// Error
{ success: false, error: "Message", details?: [...] }
```

### Actor System

Users and groups both have actors. All entities reference `actor_id` instead of `user_id`. This enables context switching between individual and group dashboards without special-casing ownership logic throughout the codebase.

One ownership model. One permission check. Works for individuals and organizations.

### Bitcoin-Native Engineering

Bitcoin is not a payment plugin — it is the unit of account.

- All prices stored as integers in satoshis (BigInt) — floating-point precision errors are structurally impossible
- Lightning Network as native payment format, not an adapter over fiat rails
- `useDisplayCurrency` hook converts sats to the user's preferred display currency (default: CHF)
- LNURL payment integration with QR code generation
- Bitcoin orange (#F7931A) reserved exclusively for Bitcoin-specific UI elements — not decoration

### Security Model

- Row Level Security (RLS) enforced at the database level, not application code. If the app has a bug, the database still refuses unauthorized access.
- Zod schemas as SSOT for validation — TypeScript types derived from schemas, never defined separately
- Remote-only Supabase (shared cloud, no local Docker emulation diverging from production)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, React 18, TypeScript 5.8 |
| Styling | Tailwind CSS 3.3, shadcn/ui |
| Database | Supabase (PostgreSQL 15), Row Level Security |
| Bitcoin | bitcoinjs-lib, Lightning Network, LNURL |
| Auth | Supabase Auth, JWT, Row Level Security |
| Validation | Zod, React Hook Form |
| State | Zustand, TanStack Query |
| Deployment | Vercel, GitHub Actions |

<details>
<summary><strong>Quick Start</strong></summary>

### Prerequisites

- Node.js 18+
- A Supabase project (remote — no local Docker)
- Bitcoin/Lightning node access for payment features

### Setup

```bash
git clone https://github.com/your-org/orangecat.git
cd orangecat
npm install
cp .env.example .env.local
# Fill in Supabase credentials, Bitcoin config
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Environment Variables

Configure in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase key
- Bitcoin/Lightning configuration as documented in `.env.example`

</details>

## Project Structure

```
src/
  config/
    entity-registry.ts    -- SSOT: all 13 entity types defined here
  lib/
    api/
      compose.ts          -- Middleware composition
      entityCrudHandler.ts -- Generic CRUD for all entities
      responses.ts        -- Standardized API responses
    auth/                  -- Authentication and session management
    domain/                -- Business logic (no HTTP, no UI)
    bitcoin/               -- Satoshi math, Lightning, LNURL
  app/
    api/                   -- API routes (thin, composed from middleware)
    (dashboard)/           -- Actor-aware dashboard views
  components/
    entities/              -- Entity-type-aware UI components
    bitcoin/               -- Payment, QR, currency display
```

## Testing

84 test files covering unit, integration, E2E, security, and smoke tests.

**CI/CD Workflows:**
- `ci.yml` — Full test suite on every push
- `e2e-auth.yml` — End-to-end authentication flows
- `one-button-deploy.yml` — Production deployment
- `promote-develop-to-main.yml` — Branch promotion with gates
- `auto-merge-claude-branches.yml` — Automated merging of AI-generated PRs

**Pre-commit hooks** run type-check, lint, unit tests, and E2E smoke tests. Nothing reaches the remote without passing locally first.

## License

MIT
