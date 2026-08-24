# URL → Entity Creation (Cat)

**created_date:** 2026-08-20  
**last_modified_date:** 2026-08-20  
**last_modified_summary:** EntityType for collectives is `organization` (legacy `group` alias).

## Overview

OrangeCat Cat can draft entities from a URL the user pastes in chat. The user
reviews draft cards and publishes; nothing is created automatically.

Entity type meanings: **`docs/architecture/ENTITY_TYPES.md`**. Standing
collectives use EntityType **`organization`**.

## Tool chain

| Step      | Tool                              | Code                                           |
| --------- | --------------------------------- | ---------------------------------------------- |
| Detection | URL + intent, or URL-only message | `tool-use-detection.ts`, `tool-use.ts`         |
| Fetch     | SSRF-safe HTML → text             | `website-analysis.ts`                          |
| Execute   | `analyze_website`                 | `tool-executor.ts`                             |
| Draft     | `prefill_entity_form`             | `tool-executor.ts` → `form-prefill-service.ts` |
| Publish   | User action                       | Entity create forms                            |

## Entity type mapping

| Website evidence                            | Entity type          |
| ------------------------------------------- | -------------------- |
| Nonprofit, association, collective, company | `organization`       |
| Service offering                            | `service`            |
| Product for sale                            | `product`            |
| Fundraising / mission                       | `cause` or `project` |
| Dated event                                 | `event`              |
| Research / publication focus                | `research`           |

## Known limitations

| Source                          | Behaviour                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| LinkedIn / Instagram / Facebook | Blocked before fetch; ask for public website or description |
| JS-only (SPA) sites             | May return thin text; Cat asks one clarifying question      |

## Example: AOM

`AOM` is a pseudonymous **`organization`** for the `aoz-housing` product. See
`docs/reference/content/aom-profile.md`.

## Tests

- `__tests__/unit/cat/website-analysis.test.ts`
- `__tests__/unit/config/entity-guides.test.ts`
