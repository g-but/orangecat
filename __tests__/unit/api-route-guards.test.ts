/**
 * API route guard gate — walks every route.ts under src/app/api and pins two
 * invariants for mutating handlers (POST/PUT/PATCH/DELETE):
 *
 *   1. AUTH: the route authenticates the caller (or is explicitly allowlisted
 *      as an intentionally-public mutator, each with a reason).
 *   2. RATE LIMIT: the route rate-limits writes (directly, via the loan/entity
 *      factories that limit internally, or is explicitly allowlisted).
 *
 * This is a source-level heuristic, not a runtime test: it can't prove a guard
 * fires, but it makes silently shipping a new unguarded mutating route
 * impossible. If this test fails on a new route, add the guard — only add an
 * allowlist entry when the route is public/unlimited BY DESIGN, and say why.
 */

import fs from 'fs';
import path from 'path';

const API_ROOT = path.join(process.cwd(), 'src', 'app', 'api');

/** Collect every route.ts under src/app/api, as paths relative to API_ROOT. */
function collectRouteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRouteFiles(full));
    } else if (entry.name === 'route.ts') {
      results.push(path.relative(API_ROOT, full).split(path.sep).join('/'));
    }
  }
  return results;
}

/** Does the file export a mutating HTTP handler? */
const MUTATING_EXPORT =
  /export\s+(?:async\s+)?(?:function|const)\s+(?:POST|PUT|PATCH|DELETE)\b|export\s*\{[^}]*\b(?:POST|PUT|PATCH|DELETE)\b[^}]*\}/;

/**
 * Pure re-export routes (the /api/v1 façade) delegate their guards to the
 * target internal route, which this walker also visits — skip them.
 */
const DELEGATED_REEXPORT = /export\s*\{[^}]*\}\s*from\s*['"]@\/app\/api\//;

/**
 * Evidence of authentication. Factory tokens count because the factories
 * (entityCrudHandler / entityPostHandler) authenticate internally.
 */
const AUTH_TOKENS =
  /withAuth|withOptionalAuth|createEntityCrudHandlers|createEntityPostHandler|entityPostHandler|resolveRequestAuth|verifyCronSecret|getAuthenticatedUserId|auth\.getUser|REINDEX_SECRET/;

/** Intentionally-public mutating routes. Every entry needs a reason. */
const AUTH_ALLOWLIST: Record<string, string> = {
  // Session-establishing endpoints: they RECEIVE credentials, so cannot
  // require an authenticated session; all three are per-IP rate limited.
  'auth/callback/route.ts': 'session bootstrap — validates Supabase tokens itself',
  'auth/verify-captcha/route.ts': 'pre-registration CAPTCHA check',
  // Anonymous tipping is a product feature (easy UX, non-custodial); abuse is
  // bounded per-IP and per-recipient instead of per-account.
  'tips/invoice/route.ts': 'anonymous tip invoice mint by design',
  'tips/status/route.ts': 'anonymous tip settlement poll by design',
  // Public support/payment claim flow: anonymous payers hold a capability
  // token (x-payment-token) instead of an account.
  'v1/payments/public/route.ts': 'anonymous public-support initiation by design',
  'v1/payments/public/[id]/route.ts': 'payment-token-gated claim action by design',
};

/**
 * Evidence of write rate limiting. The case-insensitive token matches every
 * limiter in @/lib/rate-limit (rateLimit*, apiRateLimited, loanWriteRateLimit)
 * and the factories, which rate-limit internally.
 */
const RATE_LIMIT_TOKENS = /rateLimit|createEntityCrudHandlers|createEntityPostHandler/i;

/** Mutating routes intentionally left without a write quota. Reasons required. */
const RATE_LIMIT_ALLOWLIST: Record<string, string> = {
  'admin/reindex-embeddings/route.ts':
    'REINDEX_SECRET-gated machine reconciler driven by DB triggers — a quota would drop legitimate reindex bursts',
};

describe('API route guards (source-level gate)', () => {
  const routeFiles = collectRouteFiles(API_ROOT);
  const sources = new Map(
    routeFiles.map(file => [file, fs.readFileSync(path.join(API_ROOT, file), 'utf8')])
  );
  const mutatingRoutes = routeFiles.filter(file => {
    const source = sources.get(file)!;
    return MUTATING_EXPORT.test(source) && !DELEGATED_REEXPORT.test(source);
  });

  it('finds API routes (sanity check that the walker works)', () => {
    expect(routeFiles.length).toBeGreaterThan(50);
    expect(mutatingRoutes.length).toBeGreaterThan(50);
  });

  it('every mutating route authenticates or is explicitly public', () => {
    const unguarded = mutatingRoutes.filter(
      file => !AUTH_TOKENS.test(sources.get(file)!) && !(file in AUTH_ALLOWLIST)
    );
    expect(unguarded).toEqual([]);
  });

  it('every mutating route rate-limits writes or is explicitly exempt', () => {
    const unlimited = mutatingRoutes.filter(
      file => !RATE_LIMIT_TOKENS.test(sources.get(file)!) && !(file in RATE_LIMIT_ALLOWLIST)
    );
    expect(unlimited).toEqual([]);
  });

  it('allowlists contain no stale entries', () => {
    // An entry whose route no longer exists — or now carries the guard — is
    // dead weight that would silently excuse a future regression.
    const staleAuth = Object.keys(AUTH_ALLOWLIST).filter(
      file => !mutatingRoutes.includes(file) || AUTH_TOKENS.test(sources.get(file) ?? '')
    );
    const staleRateLimit = Object.keys(RATE_LIMIT_ALLOWLIST).filter(
      file => !mutatingRoutes.includes(file) || RATE_LIMIT_TOKENS.test(sources.get(file) ?? '')
    );
    expect(staleAuth).toEqual([]);
    expect(staleRateLimit).toEqual([]);
  });
});
