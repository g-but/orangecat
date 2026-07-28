/**
 * Provider error classification for the Cat chat fallback chain.
 *
 * Pure functions, no imports — extracted from chat-orchestrator.ts so the
 * chain-walk policy is unit-testable without dragging in the orchestrator's
 * runtime dependencies (rate-limit store, Supabase, streaming).
 */

/**
 * Provider-agnostic rate-limit detection. Every AI provider error class we ship
 * (GroqAPIError, OpenRouterAPIError, OpenAICompatibleAPIError) carries a
 * `statusCode` field — 429 means rate limit, full stop. Some providers also
 * surface a `type: 'rate_limit'` discriminator. Check both first because
 * they're cheap and unambiguous; fall back to message-pattern matching.
 */
export function isAiRateLimitError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as { statusCode?: number; type?: string };
    if (e.statusCode === 429) {
      return true;
    }
    if (e.type === 'rate_limit') {
      return true;
    }
  }

  // Message-pattern fallback. Different providers phrase rate-limit
  // messages differently — Groq says "rate limit" or "tokens per minute,"
  // OpenRouter says "rate-limited upstream," Together says "too many
  // requests" or "rate limit exceeded." Match all common variants.
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('rate limit') ||
      msg.includes('rate-limit') ||
      msg.includes('ratelimit') ||
      msg.includes('tokens per minute') ||
      msg.includes('request too large') ||
      msg.includes('too many requests') ||
      msg.includes('429')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Detect "this model no longer exists" provider errors. OpenRouter free model
 * IDs rot — retired IDs return 404 ("No endpoints found for …"), and Groq
 * decommissions return 404/400 with "model … does not exist / has been
 * decommissioned". These MUST advance the fallback chain exactly like a
 * rate-limit: a dead model id is a dead link in the chain, not a dead
 * platform. (Before this, one retired ID aborted the walk and took the whole
 * Cat down while live models sat unused later in the chain.)
 */
export function isAiModelUnavailableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const e = error as { statusCode?: number };
    if (e.statusCode === 404) {
      return true;
    }
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('no endpoints found') ||
      msg.includes('not a valid model') ||
      msg.includes('model not found') ||
      msg.includes('does not exist') ||
      msg.includes('decommissioned') ||
      msg.includes('404')
    ) {
      return true;
    }
  }
  return false;
}

/** An error the fallback chain should roll past (rate-limited OR dead model). */
export function isFallbackWorthyError(error: unknown): boolean {
  return isAiRateLimitError(error) || isAiModelUnavailableError(error);
}
