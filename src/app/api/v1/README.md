# OrangeCat Public API — `/api/v1/`

**This tree is the stable contract** that external integrations
(FleetCrown, hirn.li, third-party tools) consume. The non-versioned
`/api/<entity>/route.ts` files remain the internal handlers that the
OrangeCat web app calls from the user's session.

## The contract

1. **Breaking changes to a `/v1/` endpoint are forbidden.** A breaking
   change ships under `/v2/` with `/v1/` still serving the old shape.
2. **Non-breaking additions are fine** — new optional request fields,
   new response fields integrations can ignore.
3. **Auth**: every `/v1/` route accepts the integration-key auth path
   (`X-OrangeCat-Key: ock_…` or `Authorization: Bearer ock_…`).
   Supabase session cookies are also accepted — the web app and a curl
   from an integrator share the same code path.

## How the re-exports work

Each route file under `/api/v1/<entity>/route.ts` currently re-exports
the `POST` handler from the internal `/api/<entity>/route.ts`:

```ts
// src/app/api/v1/products/route.ts
export { POST } from '@/app/api/products/route';
```

This costs nothing while the internal handler matches the v1 contract.
The day the internal handler needs a breaking change (e.g. a Zod field
gets renamed), the re-export is replaced with an adapter:

```ts
// src/app/api/v1/products/route.ts
import { POST as internal } from '@/app/api/products/route';

export async function POST(req: NextRequest) {
  // translate v1 request shape → internal shape
  // call `internal`
  // translate internal response → v1 response shape
}
```

The discipline: **if you change an internal entity route, check
whether the matching `/api/v1/<entity>/route.ts` is still a valid v1
contract**. If not, replace the re-export with an adapter before
landing the internal change.

## Machine-readable contract

- **OpenAPI 3.1 spec**: `GET /api/v1/openapi.json` (live, generated from the Zod schemas the server actually validates against — no drift possible).
- **Conventions** (versioning, error codes, idempotency, rate limits): [`docs/api/CONVENTIONS.md`](../../../docs/api/CONVENTIONS.md).

## What's exposed today

Only `POST` on the entity routes — entity _creation_ is the only
end-to-end-tested API surface so far. GET / PUT / DELETE will land
under `/v1/` once they accept integration-key auth (the internal
handlers currently require a session).

| Endpoint              | Method | What it does                 |
| --------------------- | ------ | ---------------------------- |
| `/api/v1/products`    | POST   | Create a product             |
| `/api/v1/services`    | POST   | Create a service             |
| `/api/v1/projects`    | POST   | Create a fundraising project |
| `/api/v1/causes`      | POST   | Create a cause               |
| `/api/v1/events`      | POST   | Create an event              |
| `/api/v1/loans`       | POST   | Create a loan                |
| `/api/v1/investments` | POST   | Create an investment         |
| `/api/v1/assets`      | POST   | Create an asset              |
| `/api/v1/wishlists`   | POST   | Create a wishlist            |

### Payments (the machine-payable loop)

| Endpoint                       | Method | Auth                     | What it does                                              |
| ------------------------------ | ------ | ------------------------ | --------------------------------------------------------- |
| `/api/v1/payments`             | POST   | key (`payments.write`)   | Create a payment intent + Lightning invoice for an entity |
| `/api/v1/payments/{id}`        | GET    | key (`payments.read`)    | Live settlement status (NWC lookup / LNURL verify)        |
| `/api/v1/payments/public`      | POST   | none (IP rate-limited)   | Account-less payment; returns invoice + status token      |
| `/api/v1/payments/public/{id}` | GET    | `X-Payment-Token` header | Status polling for account-less payments                  |

Together with entity list/get and `/api/v1/search`, this closes the agent
buy loop: **discover → quote → pay → verify**. The full walkthrough with
curl examples lives in [`docs/api/AGENTS.md`](../../../docs/api/AGENTS.md).

### Publish bus

| Endpoint                   | Method | What it does                                          |
| -------------------------- | ------ | ----------------------------------------------------- |
| `/api/v1/timeline/publish` | POST   | Publish an external build event onto a project's wall |
| `/api/v1/stakeholders`     | GET    | List stakeholder relationships for a project          |
| `/api/v1/stakeholders`     | POST   | Create a stakeholder relationship                     |

`/api/v1/timeline/publish` is the async publish bus: an external client
(FleetCrown) lands a publish-worthy build event onto a project's OrangeCat
wall (`timeline_events`). Requires the `timeline.write` scope and ownership of
the subject project. Idempotent + reconcilable — keyed by
`(source, external_id)`, so a retry or an edit updates the same row rather than
duplicating it. Inbound contract SSOT: `src/config/external-publish.ts`. See
`docs/architecture/PLATFORM_AND_COLLABORATION.md` ("Async publish + read-only
surfacing").

`/api/v1/stakeholders` exposes the typed project→stakeholder graph for
integration clients (FleetCrown). Requires `stakeholders.read` / `stakeholders.write`
and ownership of the source project. Contract SSOT: `src/config/stakeholders.ts`.

### Identity resolution

| Endpoint                        | Method | Auth              | What it does                                          |
| ------------------------------- | ------ | ----------------- | ----------------------------------------------------- |
| `/api/v1/profiles`              | GET    | none (IP-limited) | Resolve up to 100 actor ids / handles in one call     |
| `/api/v1/profiles/{idOrHandle}` | GET    | none (IP-limited) | Resolve one actor id, profile id, group id, or handle |

Every other v1 surface hands back an `actor_id` — stakeholder edges, entity
ownership, payment intents, timeline events. These two turn that UUID into
somebody you can name, so the typed customer graph renders as people and teams
rather than as a column of identifiers. Users and groups come back in **one
shape**, because a stakeholder edge may point at either.

Public and unauthenticated, like `/api/v1/search` and `/api/v1/demand`: the
response contains exactly what an anonymous visitor already reads off
`/profiles/<handle>`, honouring the owner's per-field hide list. Email, phone,
payment addresses and location are deliberately **not** in it — email flows with
consent through the OIDC `email` scope, payment data has `wallet.read`, and
location has its own three-state control. Contract SSOT:
`src/config/public-profile.ts`.

Two details worth knowing: a handle the account has since **retired** still
resolves (renames are non-breaking by design, and a resolver that only knew
current handles would reintroduce the breakage `profile_username_history` exists
to prevent), and `url` is **absolute** — a relative path would resolve against
the calling client's own origin.

`/api/v1/search?type=people` results carry a `handle` field, so a search hit
feeds straight into `GET /api/v1/profiles?handles=…`.

To keep a cached identity fresh, subscribe a webhook endpoint to
`profile.updated`; the payload carries the same public-profile shape.

## Out of scope for v1 (until further notice)

- `/api/wallets/*` — wallet linkage has app-specific semantics
- `/api/groups/*` — group creation triggers actor + membership flows
- `/api/ai-assistants/*` — separate monetization model
- `/api/documents/*` — internal Cat context, not a customer-facing entity

These remain reachable as internal endpoints; integrations should not
depend on them.
