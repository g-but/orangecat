# ADR: Bitcoin Balance MVP, Media Gallery, and Schema Hygiene

Date: 2025-11-04

Status: Accepted

## Context

We are introducing a GoFundMe-style project page refresh and a minimal backend refactor:

- Show amount raised computed from live Bitcoin balance (mempool.space) instead of persisting fiat totals.
- Add optional `website_url`, `cover_image_url`, and a 3-image gallery for each project.
- Keep risk low: additive-only DB migrations; no breaking renames; wallet optional.

Current DB (from Supabase audit): `public.projects` has `id, user_id, title, description, goal_amount, currency('SATS' default), funding_purpose, bitcoin_address, lightning_address, category, tags, status('draft'), raised_amount, created_at, updated_at`.

## Decisions

1. Additive-only migration (no renames yet)

- Add columns: `bitcoin_balance_btc NUMERIC(20,8) DEFAULT 0`, `bitcoin_balance_updated_at TIMESTAMPTZ`, `website_url TEXT`, `cover_image_url TEXT`.
- Create `public.project_media` with `id, project_id, storage_path, position, alt_text, created_at`, constraints: `UNIQUE(project_id, position)`, `CHECK position BETWEEN 0 AND 2`.
- Indexes: `projects(user_id)`, partial on `bitcoin_address`, partial on `bitcoin_balance_updated_at`, `projects(status)`, `projects(created_at DESC)`, and `project_media(project_id, position)`.

2. RLS

- Enable RLS on `projects` and `project_media`.
- Policies (idempotent, drop-if-exists then create):
  - projects: public SELECT active; owner SELECT/INSERT/UPDATE/DELETE.
  - project_media: public SELECT; owner INSERT/UPDATE/DELETE.

3. Currency handling

- Do not rename `currency` now. In TypeScript, alias to `goal_currency` at API boundaries.
- Do not set a new DB default (no CHF default). Remove SATS handling in app code only.

4. Media storage

- Bucket `project-media`, public read for MVP.
- Enforce folder convention `project-media/{project_id}/...` in presigned upload endpoint.
- Store only `storage_path` in DB; derive URL at read time.

5. Refresh model

- Manual refresh only (no cron). 5‑minute cooldown using `bitcoin_balance_updated_at`.
- Idempotency guard: if updated within the last second, return cached value.

## Alternatives Considered

- Proxy uploads via API: rejected (cost and fragility). Presigned uploads chosen.
- Historical snapshots and goal events now: deferred to a later phase to reduce scope.
- Forcing wallet at project creation: rejected to keep onboarding friction low.

## Consequences

- Backward compatible: legacy `raised_amount` kept for display fallback when no wallet/balance.
- Easy future extensions: add history tables, signed GETs, new currencies without schema churn.

## Implementation Outline

- Migration SQL: additive columns, new table, indexes, RLS with DROP POLICY IF EXISTS.
- Storage policies for `project-media`: public read; owner write/delete based on `{project_id}` path.
- Endpoints: `POST /api/projects/[id]/refresh-balance` (ownership + cooldown + idempotent), `POST /api/projects/[id]/media/upload-url` (presigned; path/extension validation), `POST /api/projects/[id]/media` (store metadata, cap 3, derive URL on read).
- Types: `Project` with `goal_currency` alias from `currency`; `ProjectMedia` with `storage_path`.
- UI: summary rail uses live conversion when `bitcoin_balance_btc > 0`, else falls back to `raised_amount`. Gallery shows up to 3 images.

## Rollout Plan

1. Tag current main as snapshot; create feature branch `feat/bitcoin-balance-mvp`.
2. Apply migration + storage policies to dev; verify with provided queries.
3. Implement endpoints and UI; test with testnet address and sample images.
4. Deploy to staging; monitor; then prod. Later: consider dropping `raised_amount` and renaming `currency`.
