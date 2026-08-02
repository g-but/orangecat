/**
 * Provider-link health memory — a tiny circuit breaker for the Cat chain.
 *
 * When a platform link (provider+model) fails, the chat walk moves on — but
 * without memory, the NEXT message pays the same dead link's round-trip
 * again (a rate-limited Groq adds ~1-2s to every message for the whole
 * rate-limit window). Marking a link down for a short TTL lets the chain
 * builder skip it while it's known-dead, then automatically retry after.
 *
 * Deliberately simple: an in-process Map. The self-hosted app is one
 * long-lived Node process, so this covers all requests; if we ever go
 * multi-process, the worst case is each process re-learning independently —
 * safe, just less effective. Never applied to BYOK keys (the user's own
 * capacity is theirs to burn), and pruning NEVER empties a chain: with
 * every link down, retrying them all beats refusing to try.
 */

const DEFAULT_TTL_MS = 60_000;

const downUntil = new Map<string, number>();

const linkKey = (provider: string, model: string): string => `${provider}:${model}`;

/** Record a failed link so chain builders can skip it for a while. */
export function markLinkDown(
  provider: string,
  model: string,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  downUntil.set(linkKey(provider, model), Date.now() + ttlMs);
}

/** Is this link inside its down-window? Expired entries are cleaned up lazily. */
export function isLinkDown(provider: string, model: string): boolean {
  const key = linkKey(provider, model);
  const until = downUntil.get(key);
  if (until === undefined) {
    return false;
  }
  if (Date.now() >= until) {
    downUntil.delete(key);
    return false;
  }
  return true;
}

/**
 * Drop known-down links from a chain — unless that would drop ALL of them,
 * in which case the original chain is returned untouched (retrying dead
 * links is strictly better than having nothing to try).
 */
export function pruneDownLinks<T>(
  links: T[],
  keyOf: (link: T) => { provider: string; model: string }
): T[] {
  const alive = links.filter(l => {
    const k = keyOf(l);
    return !isLinkDown(k.provider, k.model);
  });
  return alive.length > 0 ? alive : links;
}

/** Test hook: forget everything. */
export function resetLinkHealth(): void {
  downUntil.clear();
}
