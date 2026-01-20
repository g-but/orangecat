---
created_date: 2026-01-18
last_modified_date: 2026-01-18
last_modified_summary: Initial engineering principles (privacy/local-first, SSOT/DRY/SoC, a11y, security-by-default)
---

# Engineering Principles

These principles guide feature design and implementation across Orangecat.

## Product Principles
- Privacy-first: Minimize data collection and retention; private by default; explicit user actions to persist/share.
- Local-first: Prefer local execution paths when feasible; remote as opt-in or fallback.
- Progressive disclosure: Simple defaults; reveal complexity only when needed.
- Empower users: Provide model choice and clear trade-offs (cost, rate limits, capabilities).

## Technical Principles
- SSOT: Single sources of truth for entities, models, navigation, and configuration.
- DRY: Reuse workflows/components (CreateEntityWorkflow, EntityForm, ModelSelector, etc.).
- Separation of concerns: Thin UI; provider adapters; clear API surfaces; isolated persistence concerns.
- SSR safety: Guard browser-only features with `'use client'` and runtime checks.
- Accessibility: Keyboard navigation, visible focus, proper aria labels, readable contrast.

## Security Principles
- Least privilege: Scope keys, tokens, and access; never expose secrets to the client.
- Encrypt at rest: BYOK/API keys encrypted using AES-256-GCM with dedicated secrets.
- No sensitive content logging: Avoid logging chat contents or PII; use structured metadata only.
- Feature flags: Gate non-critical features and risky integrations.
- Defense in depth: Rate limiting, RLS, CSP/headers, dependency scanning.

## Observability & Quality
- Errors: User-friendly messages; structured error responses; correlation IDs where applicable.
- Tests: Unit + integration for core logic; E2E for critical flows; mock external services.
- Performance: Streaming for incremental UX; avoid heavy client bundles; cache where appropriate.
- Documentation: ADRs for key decisions; specs for reusable components; update docs with code changes.

## Application to AI/Voice Features
- Private chat: No server-side persistence of My Cat chats by default; only explicit conversion to entities persists.
- Model choice: Local runtime support (Ollama/LM Studio) and BYOK with encrypted storage; offer a client-only key mode where practical.
- Voice input: Default to browser Web Speech API; future optional local Whisper endpoint; no audio uploads by default.
- Prefill flows: Use localStorage as a transient bridge; keep server decoupled from chat.

