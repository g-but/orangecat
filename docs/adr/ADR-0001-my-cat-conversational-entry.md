# ADR-0001: My Cat Conversational Entry Layer

Date: 2026-01-18
Status: Accepted (MVP shipped)

## Context

Users benefit from describing their goals in natural language, not just filling forms. Orangecat already provides a unified create workflow and templates, but voice/text conversational entry can reduce friction further. We must preserve privacy and allow model choice (local or proprietary), while keeping architecture SSOT/DRY/SoC.

## Decision

Introduce a conversational entry layer called “My Cat” that:
- Offers private, ephemeral chat with optional voice input.
- Supports local models (Ollama/LM Studio) and remote models via OpenRouter (BYOK/free).
- Suggests entities based on intent and pre-fills the relevant create form.

## Rationale

- Privacy: Local-first option; no server persistence by default for private chat.
- Flexibility: Power users can choose models and costs; casual users get good defaults.
- Reuse: Leverages SSOT registries, unified create workflow, and existing assistant ecosystem.

## Consequences

- Adds one API (`/api/cat/chat`) and a client component (`CatChatPanel`).
- Slight increase in settings (local provider config); minimal coupling to forms via localStorage prefill.
- Requires ongoing attention to key handling and rate limiting.

## Alternatives Considered

- Persist all chat by default: rejected for privacy and complexity.
- Remote-only models: rejected to preserve offline/local-first capability.
- Storing BYOK client-only: planned as an option; DX trade-offs.

## Follow-ups

- Streaming for local/remote.
- Client-only key mode (optional).
- Optional local Whisper endpoint.
- Extend prefill beyond Services.

