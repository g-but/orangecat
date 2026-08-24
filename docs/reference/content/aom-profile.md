# AOM

**created_date:** 2026-08-20  
**last_modified_date:** 2026-08-20  
**last_modified_summary:** AOM maps to EntityType `organization` (renamed from `group`).

## Purpose

`AOM` is the pseudonymous collective identity we use on OrangeCat for the
real delivery project that internally lives as `aoz-housing`.

The split is deliberate:

- **Real internal delivery name:** `aoz-housing`
- **Real infrastructure slug:** `aoz-wohnen`
- **Pseudonymous public/demo identity:** `AOM` (short form only — no expanded fiction)
- **Live product site:** `aoz.orangecat.ch` (keeps its own product presentation)
- **OrangeCat entity type:** `organization` (see `docs/architecture/ENTITY_TYPES.md`)

## Short Profile

**Name:** AOM  
**Type:** pseudonymous `organization` on OrangeCat (label typically `nonprofit`)  
**Domain focus:** housing placement, resident guidance, and stable shared
living for people in transition

## One-Liner

AOM coordinates housing placement and day-to-day guidance with dignity,
transparency, and compatibility-first decisions.

## Long Description

AOM is a fictionalised collective identity used to present the staff-facing
housing and resident-support workflows of the `aoz-housing` system without
binding the public story to the real client name.

On OrangeCat, AOM represents a collective that:

- places people into shared housing using compatibility rather than vacancy
  alone;
- supports residents with guidance, routines, messaging, learning, and
  follow-through;
- treats stability, capability, participation, and guidance as one connected
  operational system.

## Creating AOM from a URL

Paste a public website into Cat chat. Pipeline: `analyze_website` →
`prefill_entity_form` → draft cards → user publishes.

Prefer `organization` for the standing identity. Additional types (`cause`, `project`,
`service`, `event`) only when the site evidences them.

See `docs/features/url-to-entity.md` and `docs/architecture/ENTITY_TYPES.md`.

## Tone

Calm, competent, humane, practical, systems-minded. Avoid bureaucratic
coldness and saviour language.

## Guardrail

This is a **pseudonymous presentation layer**. Do not rename infra, database
names, or box paths to match AOM.
