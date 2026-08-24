# Entity Types — Guide & SSOT

**created_date:** 2026-08-20  
**last_modified_date:** 2026-08-20  
**last_modified_summary:** EntityType `group` renamed to `organization`. DB table remains `groups`; URLs are `/organizations`.

## Where truth lives

| Layer            | Path                                | Role                                             |
| ---------------- | ----------------------------------- | ------------------------------------------------ |
| **Code SSOT**    | `src/config/entity-registry.ts`     | Types, tables, paths, icons, payment patterns    |
| **Meaning SSOT** | `src/config/entity-guides.ts`       | When to use / not for / examples / related types |
| **This doc**     | `docs/architecture/ENTITY_TYPES.md` | Human guide — must match the two files above     |

Do not invent entity types in prompts, FAQ, or fleet docs. If the registry
does not list it, it is not an entity type.

**Standing collectives are EntityType `organization`.** Labels (`nonprofit`,
`company`, `dao`, …) live in `group-labels.ts` and are not separate types.
Legacy name `group` maps via `LEGACY_ENTITY_ALIASES` → `organization`.

| Concern                 | Canonical                                             |
| ----------------------- | ----------------------------------------------------- |
| EntityType              | `organization`                                        |
| Postgres table          | `groups` (unchanged)                                  |
| HTTP API                | `/api/groups` (unchanged)                             |
| Public / dashboard URLs | `/organizations`, `/dashboard/organizations`          |
| Cat actions             | `create_organization`, `invite_to_organization`       |
| `actors.actor_type`     | still `'group'` in DB (maps to organization entities) |

---

## Quick chooser

```text
Standing collective (nonprofit, company, DAO, …)  →  organization
Loose interest community                          →  circle
Time-bound funded initiative                      →  project
Open donor ask / mission                          →  cause
Sell a good                                       →  product
Sell labour / expertise                           →  service
Dated gathering                                   →  event
Rent / collateralise something you own            →  asset
Borrow / lend BTC                                 →  loan
Equity / revenue-share raise                      →  investment
DeSci topic                                       →  research
Gift registry                                     →  wishlist
Private Cat context                               →  document
Settlement rails                                  →  wallet
```

One real-world org often needs **several** entities: e.g. `organization`
(identity) + `cause` (donate) + `project` (this year’s programme) + `service`.

---

## `organization` (was `group`)

- **Summary:** Standing collective identity — membership, governance, treasury.
- **When:** Nonprofit, company, DAO, cooperative, guild, network.
- **Labels:** see `src/config/group-labels.ts`.
- **Not for:** Loose hangouts (`circle`); one-off fundraise only (`cause` / `project`).

## `circle`

- Lightweight interest community — less formal than `organization`.

(Other types: see `ENTITY_GUIDES` in `entity-guides.ts` — keep this doc’s
chooser aligned when adding types.)

---

## Actors vs entities

- **`actors`:** `actor_type` is `user` | `group` in the database. An
  `organization` entity gets an actor with `actor_type = 'group'` and
  `group_id` pointing at the `groups` row.
- **Profiles** may set `profile_type: 'organization'` — account metadata, not
  EntityType. Prefer a real **`organization`** entity for collective identity.

---

## URL → entity

Paste a URL into Cat → `analyze_website` → up to 3 `prefill_entity_form`
drafts. See `docs/features/url-to-entity.md`.

---

## Adding a type

1. Add to `ENTITY_TYPES` and `ENTITY_REGISTRY`.
2. Add `ENTITY_GUIDES[type]`.
3. Update this doc’s quick chooser.
4. Wire config, create form, API, Cat creatable list if needed.
5. Never reintroduce a parallel `group` EntityType key.
