// CatChatPanel was removed — it had zero production imports and was dead code.
// The canonical AI chat implementations are:
//   - ModernChatPanel  → used in /dashboard/cat (main AI hub)
//   - AIChatPanel.tsx  → used in per-assistant conversation routes
//
// The streaming behavior tested here is covered by those implementations.
// If streaming regression tests are needed, they should target ModernChatPanel.

describe.skip('CatChatPanel streaming (remote) — REMOVED', () => {
  it('placeholder to prevent empty suite warning', () => {})
})
