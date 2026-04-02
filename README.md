# OrangeCat

Your AI economic agent — and the platform where it operates.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Live](https://img.shields.io/badge/Live-orangecat.ch-orange.svg)](https://orangecat.ch)
[![Bitcoin](https://img.shields.io/badge/Bitcoin-Native-F7931A.svg)](https://bitcoin.org)

## The Problem

Economic participation still requires gatekeepers. To sell, fund, lend, invest, or govern collectively, you need banks, payment processors, platforms that take cuts and dictate terms. Pseudonymous participation is impossible. AI agents can't transact on your behalf.

## The Solution

OrangeCat is an AI-native platform for universal economic participation. Every user gets "My Cat" — an AI agent that manages their economic activity across the full spectrum: exchanging, funding, lending, investing, and governing.

- **Any identity**: Human, pseudonymous, or AI — all are first-class economic participants
- **Any currency**: Bitcoin/Lightning is native and preferred, but any payment method (Twint, PayPal, Monero, local methods worldwide) is supported
- **Full economic spectrum**: From gifts (no strings) to loans (some strings) to investments (more strings)
- **Private where needed, transparent where chosen**: E2E encrypted messaging, on-chain transparency when appropriate

## What Works Today

- **Commerce**: Products and services with Bitcoin Lightning payments
- **Funding**: Transparent project funding, cause support, wishlists, and research funding
- **Lending**: Peer-to-peer loans with repayment tracking
- **Assets**: Real estate, collateral, and rentable asset management
- **Groups**: Organizations with shared wallets, governance proposals, and collective decision-making
- **AI Assistants**: Autonomous economic actors as first-class entities
- **Events**: Time-bound coordination with ticketing
- **Documents**: Structured context for the AI agent

Live at [orangecat.ch](https://orangecat.ch)

## Architecture

13 entity types, one registry. One ownership model (actors), one permission layer (database RLS). Adding a new entity type requires 2-3 files.

<details>
<summary><strong>Technical details</strong></summary>

### Entity Registry Pattern

`src/config/entity-registry.ts` — single source of truth for all 13 entity types. Drives CRUD, navigation, forms, and validation. No entity-specific switch statements.

### Actor System

Users and groups both have actors. All entities reference `actor_id`. One ownership model, one permission check — works for individuals, organizations, and (future) AI agents.

### Middleware Composition

```typescript
export default compose(withAuth(), withRateLimit('write'), withValidation(schema))(handler);
```

Functional composition replaces inheritance. Each middleware does one thing.

### Security

- Row Level Security (RLS) at the database level — bugs in app code can't bypass authorization
- Zod schemas as SSOT — TypeScript types derived from schemas, never separate
- Structured API responses across all 40+ routes

</details>

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Framework  | Next.js 15, React 18, TypeScript 5.8    |
| Styling    | Tailwind CSS, shadcn/ui                 |
| Database   | Supabase (PostgreSQL + RLS)             |
| Bitcoin    | Lightning Network, LNURL, bitcoinjs-lib |
| Auth       | Supabase Auth, JWT, Row Level Security  |
| Deployment | Vercel, GitHub Actions CI/CD            |

<details>
<summary><strong>Quick Start</strong></summary>

### Prerequisites

- Node.js 20+
- A Supabase project (remote — no local Docker needed)

### Setup

```bash
git clone https://github.com/g-but/orangecat.git
cd orangecat
npm install
cp .env.example .env.local
# Fill in Supabase credentials
npm run dev
```

Dev server starts at `http://localhost:3000`.

### Environment Variables

See `.env.example` for the full list. Key variables:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase key

</details>

## Project Structure

```
src/
  config/entity-registry.ts  -- SSOT: all 13 entity types
  lib/api/                    -- Middleware composition, generic CRUD
  domain/                     -- Business logic (no HTTP, no UI)
  services/                   -- Currency, search, notifications, groups
  features/                   -- Messaging, auth
  app/api/                    -- API routes (thin, composed from middleware)
  components/                 -- UI components (shadcn/ui based)
```

## Testing

17 test suites, 74 tests. Pre-push hooks run type-check, lint, and the full test suite before any code reaches the remote.

## Contributing

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities. Pull requests welcome.

## License

MIT
