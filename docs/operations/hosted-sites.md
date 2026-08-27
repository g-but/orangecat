---
created_date: 2026-08-27
last_modified_date: 2026-08-27
last_modified_summary: First version — how a group becomes a website, and the two one-time infrastructure steps behind it.
---

# Hosted sites — turning a group into a website

`/domains` sells one sentence: _"a working site, hosted and managed at
yourname.orangecat.ch — free. Move to your own domain when you are ready."_
This is how that works, and what it costs.

## Publishing a site

**One row. No deploy, no ssh, no DNS.**

```sql
INSERT INTO group_features (group_id, feature_key, enabled, enabled_by)
VALUES ('<group-uuid>', 'site', true, '<user-uuid>');
```

The site is live at `<group-slug>.orangecat.ch` within a minute — that minute is
`SITE_CACHE_TTL_SECONDS` in `src/services/sites/registry.ts`. Setting
`enabled = false` unpublishes it just as fast.

The pages are generated from the group's own profile (`src/config/site-profile.ts`):
its name, description, label, tags, and payment addresses if it has them. There
is no page builder and no second place to type the description, which is the
point — if the profile is good, the website is good.

### Optional configuration

`group_features.config` (jsonb), all fields optional:

| Field          | Default          | Meaning                                           |
| -------------- | ---------------- | ------------------------------------------------- |
| `title`        | the group's name | browser tab / OG title                            |
| `customDomain` | `null`           | canonical hostname once the owner points DNS here |
| `aliasHosts`   | `[]`             | extra hostnames answered but never advertised     |

Every field is validated with its own fallback, so one bad value costs that
field and never the site.

## How a request gets there

```
Host: acme.orangecat.ch
   │
   ├─ middleware.ts        siteSlugForHost() — pure, no database.
   │                       "acme" is one non-reserved label → rewrite.
   │                       (Rewrite, not redirect: the URL bar keeps saying acme.)
   │
   ├─ /sites/acme          siteBySlug() — reads as ANON, so RLS decides
   │                       "published". No row → 404.
   │
   └─ site-profile.ts      the group's profile, rendered as pages.
```

The split matters: middleware runs on **every request to the whole app**, so it
may never query. It answers "is this shaped like a site?" An unclaimed slug
rewrites and 404s, which is the safe direction.

`/sites/<slug>` also works on any host, which is how a site is previewed before
its DNS exists.

## Reserved subdomains

Host resolution is positional, so `RESERVED_SUBDOMAINS` (`src/config/sites.ts`)
is load-bearing twice:

- **Infrastructure** — `supabase`, `fleetcrown`, `bridge`, and 19 others already
  serve something on this box.
- **Impersonation** — `security.orangecat.ch` under our own certificate is a
  phish, not a website.

The infrastructure half is **generated, not remembered**. The first hand-written
version held 7 labels while the box was serving 22.

```bash
npm run sync:reserved-hosts    # regenerate from Caddy (needs ssh)
npm run check:reserved-hosts   # in `verify`; fails if the two disagree
```

**Deploying a new app on bitbaum will fail the build until you run the sync.**
That is deliberate: the alternative is a hostname that serves an app _and_ is
claimable as a customer's site.

## The two one-time infrastructure steps

Both are done once, ever. After them no site needs infrastructure work again.

### 1. Caddy — on-demand TLS

```bash
bash scripts/ci/install-hosted-sites-caddy.sh
```

Installs `deployment/caddy/hosted-sites.caddy` as a catch-all block and adds
`on_demand_tls { ask ... }` to the global block. The script refuses to run until
`/api/internal/tls-check` answers 200, backs up the Caddyfile, validates before
reloading, and re-checks the neighbouring hosts afterwards — one bad Caddyfile
takes down every app on the box.

A wildcard certificate was the alternative: DNS-01, an Infomaniak API token
living on the box, a Caddy DNS plugin — and it still would not have covered a
customer's own domain.

### 2. DNS — the wildcard record

At Infomaniak, on `orangecat.ch`:

```
*    A    167.233.22.31
```

**This is the only step that cannot be automated from a developer machine** —
no Infomaniak API credentials exist here. Existing named records keep
precedence, so nothing already live changes.

A customer's own domain needs no record from us at all: they point it here, and
Caddy asks `/api/internal/tls-check` whether it is real.

## Bespoke sites

A site whose content is genuinely not profile-shaped gets a builder. Substrata
is the one example — a research corpus of tables, meters and a coverage ledger,
which no generic renderer should try to guess.

Adding one means an entry in `BESPOKE_BUILDERS` and a function returning
`SitePage[]` from a closed set of section shapes (`src/config/site-content.ts`).
**This is the exception.** If you are reaching for it for an ordinary customer,
the profile builder is what should be improved instead — it costs zero lines per
customer, and a fix there reaches every site at once.

## Verifying a site

```bash
curl -sI https://acme.orangecat.ch/ | head -1
curl -s https://acme.orangecat.ch/ | grep -o '<title>[^<]*</title>'

# Would Caddy issue a certificate for this host?
curl -s -o /dev/null -w '%{http_code}\n' \
  'http://127.0.0.1:4003/api/internal/tls-check?domain=acme.orangecat.ch'
```

`403` from the last one means no published site answers on that hostname — check
`group_features.enabled`, that the group is `is_public`, and that the label is
not reserved.
