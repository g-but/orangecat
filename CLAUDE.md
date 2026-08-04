# OrangeCat

AI-native platform for universal economic and governance participation — "My Cat" AI agent enabling any identity to earn, fund, lend, invest, and govern freely with any currency.

FleetCrown (rebranded from Cockpit) is a live customer project (see "FleetCrown" and "OrangeCat" projects under Mao Nakamoto on this platform). Typed "customer" stakeholder edge + shared BTC wallet. Integration is real: FleetCrown production layer + OrangeCat economic layer. Changes here (e.g. stakeholder_relationships, project profiles) directly improve UX for FleetCrown (the customer) and all future customers.

@~/.claude/CLAUDE.md
@.claude/CLAUDE.md

## Stack

| Layer      | Technology                                                                          |
| ---------- | ----------------------------------------------------------------------------------- |
| Framework  | Next.js 16, React 19, TypeScript 5.8                                                |
| Styling    | Tailwind CSS 3.3                                                                    |
| Database   | Self-hosted Supabase (PostgreSQL + Auth + RLS) — `supabase.orangecat.ch` on Hetzner |
| Bitcoin    | Lightning Network, BTCPay, NWC                                                      |
| Deployment | Self-hosted on Hetzner (`bitbaum`, behind Caddy)                                    |

---

## Design System

### Token SSOT: `src/app/globals.css`

Every color, radius, shadow, tracking, and layout primitive is defined as a CSS custom property in `src/app/globals.css`. `tailwind.config.ts` only maps Tailwind utility classes onto those vars — it never declares a literal hex.

The design system runs in **two concentric layers**:

1. **Legacy layer** (in active use): shadcn/ui-style `--background`, `--foreground`, `--card`, `--primary`, etc. as HSL channel values; brand palette `--tiffany-{50..900}`, `--orange-{50..900}`, `--bitcoin-orange` as RGB channels. Utility classes: `bg-card`, `text-foreground`, `bg-tiffany-500`, `bg-bitcoinOrange` etc.

2. **FleetCrown-aligned semantic tier** (migration target, added in commit eff99bad): `--text-primary/secondary/tertiary/muted/inverted`, `--surface-page/base/raised/overlay/modal/drawer/public`, `--border-default/interactive`, `--accent-primary/hover` (→ `#ff5c00`), `--status-positive/warning/negative/neutral` with `-subtle` variants, `--tracking-display/label/caps`, `--shell-max`. Utility classes (commit 71c88988): `text-fg-primary`, `bg-surface-base`, `bg-accent-warm`, `bg-status-positive`, `tracking-display`, `max-w-shell`.

New components should use the semantic tier. Existing components migrate as touched.

### Bitcoin Orange Rule

`--bitcoin-orange: #f7931a` (utility `bg-bitcoinOrange`) is **only for Bitcoin-related UI** — balances, Lightning indicators, Bitcoin icons. Never for general brand elements.

### Migration direction (x.ai-quality, FleetCrown-aligned)

Multi-commit migration in progress:

- ✅ Semantic token tier added (eff99bad) + exposed via Tailwind utility classes (71c88988)
- ✅ Warm-accent Button variant; landing + auth + about + header CTAs all use `variant="accent"` (ff9f2ce5, 2cdb0907)
- ⏳ Drop chromatic brand palette (tiffany, orange) from new code; migrate existing classes to semantic tier (`bg-card → bg-surface-base`, `text-foreground → text-fg-primary`)
- ⏳ Display typography (Space Grotesk for headings, IBM Plex Mono for code) replacing Inter-only
- ⏳ Tailwind v4 + OKLCH color space

End state: monochromatic surfaces + one warm accent (`#ff5c00`) for top-of-funnel conversion + Bitcoin Orange for Bitcoin-specific UI + status colors only for actual status. Everything else stays achromatic.

**Audit commands:**

```bash
# Find arbitrary hex violations in className props
grep -rn '\[#' src/
# Current count: 0 (clean)

# Find inline style hex violations
grep -rn "style={{.*#" src/
```

---

## Shipping: nobody merges by hand

**Do not merge PRs, and do not ask anyone to.** Open a PR and stop there —
merging and deploying are automated end to end:

```
push branch → open PR → CI green → auto-merge.yml squash-merges it
            → CI on main → CD deploys to bitbaum → health check
```

`.github/workflows/auto-merge.yml` (policy in `scripts/ci/auto-merge-sweep.sh`)
merges **one** PR per sweep, and only when: it is not a draft, carries no hold
label, every check has finished green, GitHub calls it cleanly mergeable, and
main's own CI is currently green. One car per sweep is deliberate — a PR's
checks prove that PR against the main it branched from, not against the other
PRs queued beside it, so each merge is verified on main before the next couples.

**Signal "not ready" by opening a draft PR**, or by labelling it `hold` /
`no-automerge` / `do-not-merge` / `wip`. A draft waits forever. A red PR waits
until it is green. Neither needs a human.

Because of this, a green PR ships itself within minutes. Do not open a PR you
would not want deployed. If work needs to land in a specific order, keep the
later PRs as drafts until the earlier ones are on main.

**Never remove the CI re-arm at the end of the sweep script.** A push made with
the default `GITHUB_TOKEN` does not trigger workflows, and CD chains off CI — so
without that explicit dispatch, merges land on main and silently never deploy.
