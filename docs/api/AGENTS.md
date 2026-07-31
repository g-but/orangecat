# Buying on OrangeCat as a machine

OrangeCat entities — products, services, projects, causes — are payable by
any client that can speak HTTP and pay a Lightning invoice. No browser, no
account requirement, no scraping. This page is the whole loop.

**Base URL**: `https://orangecat.ch/api/v1` · **Spec**: `GET /api/v1/openapi.json`
(live OpenAPI 3.1, generated from the server's own validation schemas) ·
**Discovery**: `GET /api/v1`

## Auth: two modes

1. **Integration key** — minted by a user at Settings → Integrations. Send
   `X-OrangeCat-Key: ock_…` (or `Authorization: Bearer ock_…`). The key is
   bound to one actor and carries scopes; payments need `payments.write` /
   `payments.read` (or the `*` wildcard). Payments are attributed to the
   key's user as buyer.
2. **No auth at all** — the `/payments/public` flow. Anonymous, IP
   rate-limited, settlement verified via a per-payment bearer token.

## The loop

### 1. Discover

```bash
# Semantic search across public entities (no auth)
curl 'https://orangecat.ch/api/v1/search?q=handmade+ceramics&limit=5'

# Or list a specific entity type
curl 'https://orangecat.ch/api/v1/products?limit=20'
```

### 2. Quote

```bash
curl 'https://orangecat.ch/api/v1/products/<entity_id>'
# → price_btc, title, description — decide whether to buy
```

### 3. Pay

With a key (attributed purchase / contribution):

```bash
curl -X POST 'https://orangecat.ch/api/v1/payments' \
  -H 'X-OrangeCat-Key: ock_…' \
  -H 'Content-Type: application/json' \
  -d '{"entity_type": "product", "entity_id": "<entity_id>"}'
# → { payment_intent: { id, bolt11, status: "invoice_ready", … }, qr_data, expires_in_seconds }
```

Without an account:

```bash
curl -X POST 'https://orangecat.ch/api/v1/payments/public' \
  -H 'Content-Type: application/json' \
  -d '{"entity_type": "project", "entity_id": "<entity_id>", "amount_btc": 0.0002}'
# → additionally returns status_token — keep it, it is the only credential
```

Pay the returned `bolt11` with any Lightning wallet (NWC `pay_invoice`,
LND, CLN, an exchange withdrawal — anything that pays bolt11).

Contribution-pattern entities (project, cause, …) require `amount_btc`;
fixed-price entities (product, service) take the listed price and ignore it.

### 4. Verify

```bash
# Key flow
curl 'https://orangecat.ch/api/v1/payments/<intent_id>' \
  -H 'X-OrangeCat-Key: ock_…'

# Account-less flow
curl 'https://orangecat.ch/api/v1/payments/public/<intent_id>' \
  -H 'X-Payment-Token: <status_token>'
```

Poll until `status` is terminal. **`paid` means settled** — the server
re-checks the invoice against the receiving wallet (NWC lookup / LNURL
verify) on every read; it is not a client claim. `expired` / `failed` are
the give-up states. Respect `expires_in_seconds` from step 3 — invoices are
not payable forever.

Sellers can also subscribe to the `payment.settled` webhook instead of
polling (Settings → Integrations → Webhooks).

## Rules of the road

- **Idempotency**: entity-create endpoints accept an `Idempotency-Key`
  header. Payment creation does not yet — treat a timeout as unknown and
  reconcile via status polling, don't blind-retry the POST.
- **Rate limits**: per key for authenticated calls, per IP for the public
  flow. Back off on 429 using the `Retry-After` header.
- **Sandbox**: keys minted with the test flag (`ock_test_…`) create
  sandbox-flagged entities; live payment flows use live keys.
- **Conventions** (error envelope, versioning): see
  [`CONVENTIONS.md`](CONVENTIONS.md).
