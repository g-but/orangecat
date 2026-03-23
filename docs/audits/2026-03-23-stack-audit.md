# Civilizational Stack Audit — 2026-03-23

## Context

All projects (Botsmann, Solon, OrangeCat, datacat, Revamp-IT) are layers of one civilizational stack — hardware access, value exchange, governance, automation, research, and human learning. The goal is removing every bottleneck between a human and their full potential.

This audit covers OrangeCat in depth (the only project available in this environment) and maps strategic conclusions across the stack.

---

## OrangeCat — Value Exchange Layer

### What's Built and Working (~60% Complete)

| Area | Status | Details |
|------|--------|---------|
| Entity Registry | 100% | 14 entity types, well-structured SSOT |
| Core Marketplace | ~80% | Commerce service (404 LOC), payment flow (356 LOC), invoices, wallet resolution |
| Bitcoin/Lightning | ~75% | NWC fully implemented (NIP-47 + NIP-04). Can make/pay invoices, check balances |
| API Routes | ~70% | 100+ endpoints across all entity types |
| Domain Services | ~65% | Commerce, loans, payments, projects, causes, wishlists, documents, assets, investments |
| Data Hooks | ~75% | 30+ hooks for data fetching, currency display, payments |
| Governance Presets | Config only | 3 models defined, no execution engine |
| Cat AI Actions | Config only | 27 actions defined with risk levels, no reasoning engine |
| Tests | Unstable | ~82% pass rate, import path issues from refactoring |

### What's Missing

| Area | Completion | Gap |
|------|-----------|-----|
| "My Cat" AI Agent | ~20% | Action definitions only. No reasoning, planning, or execution. |
| Governance Execution | ~30% | Presets exist, no voting/proposal/consensus enforcement |
| Investment Entity | ~20% | 65 LOC stub. No terms, cap tables, returns |
| Nostr Integration | ~50% | NWC works. No relay messaging, no E2E chat |
| E2E Messaging | ~50% | DB-based messaging, zero encryption |
| Research/DeSci | ~30% | Entity defined, no funding mechanics |
| Rule Engine | 0% | Nothing self-executes (loans, investments, governance) |

### Architecture Assessment

The architecture is genuinely good: entity registry pattern, domain service separation, middleware composition, schema composition with Zod, actor system. The problem is completion depth, not design quality.

---

## The Full Stack Map

| Layer | Project | Purpose |
|-------|---------|---------|
| Hardware Access | Revamp-IT | Accessible computing hardware |
| Value Exchange | OrangeCat | Universal economic participation, Bitcoin-native |
| Governance | Solon | Collective decision-making at scale |
| Automation | Botsmann | AI agents / autonomous systems |
| Research | datacat | Data infrastructure / knowledge layer |
| Learning | TBD | Human skill acquisition |

---

## Strategic Finding: The Weakest Layer

**The execution/automation layer is the systemic bottleneck.**

The pattern across OrangeCat: the declarative layer is strong, the imperative layer is missing. Governance presets exist but nothing votes. Cat actions are defined but no agent reasons. Loan terms are stored but nothing auto-executes. Investment fields exist but no cap table logic runs.

This is likely the same pattern across the stack: things are *described* well but don't *do* anything yet.

---

## Highest-Leverage Next Move

**Build the Cat execution engine.**

Rationale:
1. It's the product thesis — without it, OrangeCat is just a Bitcoin marketplace
2. It unblocks governance — the Cat executes governance decisions
3. It generalizes — same agent pattern powers Botsmann, Solon, datacat
4. Infrastructure is ready — 27 actions defined, domain services exist
5. It compounds — every feature becomes 10x more powerful with a working agent

### Minimal viable Cat engine:
1. Accept user intent (natural language or structured)
2. Map to defined actions
3. Check permissions and risk level
4. Execute via existing domain services
5. Report result

### Second priority: Fix test suite
175 failing tests and import path issues are technical debt that slows everything.

---

## Open Questions (Require Access to Other Projects)

- Does Botsmann have an agent execution framework that could be shared?
- Does Solon have governance logic, or is it also config-only?
- Does datacat provide a knowledge graph the Cat could use for context?
- Is Revamp-IT actually moving hardware to people?

---

*Generated: 2026-03-23*
