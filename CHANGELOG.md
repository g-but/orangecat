# Changelog

## 0.1.2 – My Cat streaming + canonical rate limiting (2026-01-18)

- Streaming: My Cat now streams for both remote (OpenRouter SSE) and local (Ollama / OpenAI-compatible) providers.
- DRY/SSOT: Introduced `OPENROUTER_KEY_HEADER` constant; unified event-stream parsing via `readEventStream`.
- Rate limiting: Added canonical adapters (`enforceUserWriteLimit`, `enforceUserSocialLimit`) and standardized `X-RateLimit-*` + `Retry-After` headers across APIs and middleware.
- Security/ops: Scrubbed tracked secrets; added deployment checklist; clarified BYOK runtime header behavior in docs.
- Tests: Added unit tests for stream parsing and a mocked streaming component test for `CatChatPanel`.

Notes
- Some preexisting TypeScript warnings remain (dashboard/auth/search) but do not block Next builds; recommend addressing in a follow-up.

## 0.1.1
- Existing changes (see git history)

