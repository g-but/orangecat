/**
 * PRODUCTION-READY RATE LIMITING
 *
 * Uses Upstash Redis for distributed rate limiting in production.
 * Falls back to in-memory for local development.
 *
 * Setup:
 * 1. Create free account at https://upstash.com
 * 2. Create a Redis database
 * 3. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local
 *
 * Created: 2025-01-28
 * Last Modified: 2026-01-07
 * Last Modified Summary: Replaced in-memory rate limiting with Upstash Redis for serverless compatibility
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/utils/logger';

// ==================== TYPES ====================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

interface RequestLike {
  headers: {
    get(name: string): string | null;
  };
}

interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
}

// ==================== REDIS CLIENT ====================

/**
 * Create Redis client if credentials are available
 * Returns null if not configured (development fallback)
 */
function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN not configured. ' +
          'Rate limiting will use in-memory fallback which does NOT work correctly in serverless.',
        {},
        'RateLimit'
      );
    }
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedisClient();

// ==================== RATE LIMITERS ====================

/**
 * Production rate limiter using Upstash Redis
 * Uses sliding window algorithm for accurate rate limiting
 */
const createUpstashLimiter = (
  prefix: string,
  requests: number,
  window: `${number} s` | `${number} m` | `${number} h`
) => {
  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `ratelimit:${prefix}`,
    analytics: true,
  });
};

// Production rate limiters (Redis-backed)
const upstashGeneralLimiter = createUpstashLimiter('general', 100, '15 m');
const upstashSocialLimiter = createUpstashLimiter('social', 10, '1 m');
const upstashWriteLimiter = createUpstashLimiter('write', 30, '1 m');
// Caps how often a SINGLE recipient's wallet/relay can be hit by anonymous
// tip-invoice generation, regardless of the tipper's IP — so one attacker
// (even rotating IPs) can't flood a victim's NWC relay. Generous enough to
// absorb a legitimately viral post's concurrent tippers.
const upstashTipRecipientLimiter = createUpstashLimiter('tip-recipient', 20, '5 m');
// Public Ask-Cat / feedback endpoint: each submission costs a platform LLM
// call, and the caller may be anonymous — so a tight per-IP budget on top of
// the general limiter. 8 per 5 min is plenty for a real person having a
// conversation, and starves a script.
const upstashAskCatLimiter = createUpstashLimiter('ask-cat', 8, '5 m');
// Public, keyless domain search. One inbound request fans out to as many as
// MAX_CANDIDATES (24) outbound RDAP lookups against third-party registries, and
// varying the query defeats the result cache. The cost of abuse is therefore not
// our CPU — it is this box's IP being throttled or blocked by the registries we
// depend on. Same reasoning as ask-cat: an expensive downstream call on behalf
// of an anonymous caller gets its own tight budget on top of the general limiter.
const upstashDomainSearchLimiter = createUpstashLimiter('domain-search', 10, '5 m');

// ==================== FALLBACK IN-MEMORY LIMITER ====================

/**
 * In-memory rate limiter for development only
 * WARNING: Does not work correctly in serverless (each instance has separate memory)
 */
class InMemoryRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private windowMs: number;
  private maxRequests: number;

  constructor(config?: RateLimitConfig) {
    this.windowMs = config?.windowMs || 15 * 60 * 1000;
    this.maxRequests = config?.maxRequests || 100;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const existing = this.requests.get(key);

    if (existing && now > existing.resetTime) {
      this.requests.delete(key);
    }

    const entry = this.requests.get(key) || { count: 0, resetTime: now + this.windowMs };

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    this.requests.set(key, entry);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
}

// Fallback limiters for development
const fallbackGeneralLimiter = new InMemoryRateLimiter();
const fallbackSocialLimiter = new InMemoryRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 });
const fallbackWriteLimiter = new InMemoryRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });
const fallbackTipRecipientLimiter = new InMemoryRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
});
const fallbackAskCatLimiter = new InMemoryRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 8,
});
const fallbackDomainSearchLimiter = new InMemoryRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
});

// ==================== RATE LIMIT FUNCTIONS ====================

/**
 * The caller's IP, as seen through Caddy.
 *
 * One definition, because a per-IP limiter is only as correct as its notion of
 * "IP" — and three limiters had already copied these two lines verbatim.
 */
function clientIp(request: RequestLike): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
}

/**
 * Convert Upstash result to our standard format
 */
function toRateLimitResult(upstashResult: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): RateLimitResult {
  return {
    success: upstashResult.success,
    limit: upstashResult.limit,
    remaining: upstashResult.remaining,
    resetTime: upstashResult.reset,
  };
}

/**
 * General rate limit for API requests
 * 100 requests per 15 minutes per IP
 */
export async function rateLimit(request: RequestLike): Promise<RateLimitResult> {
  const ip = clientIp(request);
  const key = `api:${ip}`;

  if (upstashGeneralLimiter) {
    const result = await upstashGeneralLimiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackGeneralLimiter.check(key);
}

/**
 * Rate limit for social actions (follow, unfollow)
 * 10 actions per minute per user
 */
export async function rateLimitSocialAsync(userId: string): Promise<RateLimitResult> {
  const key = `social:${userId}`;

  if (upstashSocialLimiter) {
    const result = await upstashSocialLimiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackSocialLimiter.check(key);
}

/**
 * Rate limit anonymous tip-invoice generation PER RECIPIENT (by username).
 * 20 invoices per 5 minutes against any one recipient — protects a victim's
 * wallet/relay from invoice-spam even when the attacker rotates IPs. Apply this
 * IN ADDITION to the per-IP `rateLimit`.
 */
export async function rateLimitTipRecipient(username: string): Promise<RateLimitResult> {
  const key = `tip-recipient:${username.toLowerCase()}`;

  if (upstashTipRecipientLimiter) {
    const result = await upstashTipRecipientLimiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackTipRecipientLimiter.check(key);
}

/**
 * Rate limit public Ask-Cat / feedback submissions per IP.
 * 8 per 5 minutes — each one is a platform LLM call from a possibly anonymous
 * visitor. Apply IN ADDITION to the general per-IP `rateLimit`.
 */
export async function rateLimitAskCat(request: RequestLike): Promise<RateLimitResult> {
  const ip = clientIp(request);
  const key = `ask-cat:${ip}`;

  if (upstashAskCatLimiter) {
    const result = await upstashAskCatLimiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackAskCatLimiter.check(key);
}

/**
 * Rate limit the public domain-availability search per IP.
 *
 * 10 per 5 minutes. A person trying names types a handful of queries; a script
 * enumerating the namespace through us — and through the registries behind us —
 * does not. Apply IN ADDITION to the general per-IP `rateLimit`.
 */
export async function rateLimitDomainSearch(request: RequestLike): Promise<RateLimitResult> {
  const key = `domain-search:${clientIp(request)}`;

  if (upstashDomainSearchLimiter) {
    const result = await upstashDomainSearchLimiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackDomainSearchLimiter.check(key);
}

/**
 * Rate limit for write operations (create, update, delete)
 * 30 writes per minute per user
 */
export async function rateLimitWriteAsync(userId: string): Promise<RateLimitResult> {
  const key = `write:${userId}`;

  if (upstashWriteLimiter) {
    const result = await upstashWriteLimiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackWriteLimiter.check(key);
}

/**
 * Per-integration-key write quota.
 *
 * Per-user quotas (rateLimitWriteAsync) lump every key minted by the same
 * user into one bucket, so one buggy FleetCrown instance can DOS hirn.li
 * even though they're different keys. This function gives each integration
 * key its own bucket, keyed on integration_key_id — a leak/bug on one key
 * stays scoped to that key.
 *
 * Default: 60/min (twice the session-write limit since integrations are
 * machine-paced). Configurable per call so a future settings UI can let
 * users tune.
 *
 * In dev (no Upstash creds) the in-memory fallback is fixed at the
 * module-level 30/min — accept slight over-restriction; dev shouldn't hit
 * the limit in practice.
 */
const DEFAULT_INTEGRATION_KEY_WRITES_PER_MINUTE = 60;
const DEFAULT_INTEGRATION_KEY_READS_PER_MINUTE = 300;

const fallbackIntegrationKeyWriteLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: DEFAULT_INTEGRATION_KEY_WRITES_PER_MINUTE,
});
const fallbackIntegrationKeyReadLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: DEFAULT_INTEGRATION_KEY_READS_PER_MINUTE,
});

export async function rateLimitIntegrationKeyWrite(
  keyId: string,
  requestsPerMinute: number = DEFAULT_INTEGRATION_KEY_WRITES_PER_MINUTE
): Promise<RateLimitResult> {
  const key = `int_key_write:${keyId}`;

  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requestsPerMinute, '1 m'),
      prefix: 'ratelimit:int_key_write',
      analytics: true,
    });
    const result = await limiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackIntegrationKeyWriteLimiter.check(key);
}

/**
 * Per-integration-key READ quota. Mirror of rateLimitIntegrationKeyWrite
 * for the read path so a buggy integration's reads can't starve siblings
 * sharing an IP via the middleware's IP-based limit.
 *
 * Default 300/min — 5× the write quota since reads are cheaper. Same
 * tuning hook (requestsPerMinute) for a future settings UI.
 *
 * Stacks ON TOP of the IP-based withRateLimit('read') middleware:
 * the floor still applies (anonymous abuse protection), the per-key
 * isolation is an additional gate on top.
 */
export async function rateLimitIntegrationKeyRead(
  keyId: string,
  requestsPerMinute: number = DEFAULT_INTEGRATION_KEY_READS_PER_MINUTE
): Promise<RateLimitResult> {
  const key = `int_key_read:${keyId}`;

  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requestsPerMinute, '1 m'),
      prefix: 'ratelimit:int_key_read',
      analytics: true,
    });
    const result = await limiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackIntegrationKeyReadLimiter.check(key);
}

// ==================== NAMED ACTION LIMITS ====================

/**
 * Limits for actions identified by name rather than by request shape.
 *
 * This replaces `src/features/messaging/lib/rate-limiter.ts`, a second rate
 * limiter with its OWN in-memory Map. Two stores meant two answers: messaging
 * counted in process memory only, so it silently ignored the Redis backend the
 * rest of the app uses, and its budget could never be observed or reset
 * alongside everything else. ADR-0002 called for one implementation; this is it.
 *
 * `windowMs` is the single source — the Upstash window string is derived from
 * it, so the Redis path and the in-memory fallback cannot drift apart.
 */
export const ACTION_RATE_LIMITS = {
  /** Message sending: 60 per minute. */
  MESSAGE_SEND: { requests: 60, windowMs: 60 * 1000 },
  /** Conversation creation: 10 per minute. */
  CONVERSATION_CREATE: { requests: 10, windowMs: 60 * 1000 },
} as const;

export type RateLimitAction = keyof typeof ACTION_RATE_LIMITS;

// Built once per action on first use. Upstash limiters are null when Redis is
// unconfigured, which is the normal case on the self-hosted single-process
// deployment — see the note on the in-memory fallback above.
const upstashActionLimiters = new Map<RateLimitAction, Ratelimit | null>();
const fallbackActionLimiters = new Map<RateLimitAction, InMemoryRateLimiter>();

/**
 * Rate limit a named action for one identifier (normally a user id).
 *
 * Async because the Redis path is — the previous messaging limiter was sync,
 * which is precisely why it could never be backed by anything but local memory.
 */
export async function rateLimitAction(
  action: RateLimitAction,
  identifier: string
): Promise<RateLimitResult> {
  const { requests, windowMs } = ACTION_RATE_LIMITS[action];
  const key = `${action}:${identifier}`;

  if (!upstashActionLimiters.has(action)) {
    const seconds = Math.max(1, Math.round(windowMs / 1000));
    upstashActionLimiters.set(
      action,
      createUpstashLimiter(`action:${action}`, requests, `${seconds} s`)
    );
  }
  const upstash = upstashActionLimiters.get(action);
  if (upstash) {
    return toRateLimitResult(await upstash.limit(key));
  }

  let fallback = fallbackActionLimiters.get(action);
  if (!fallback) {
    fallback = new InMemoryRateLimiter({ windowMs, maxRequests: requests });
    fallbackActionLimiters.set(action, fallback);
  }
  return fallback.check(key);
}

/** Test seam: drop all per-action in-memory counters. */
export function _resetActionRateLimits(): void {
  fallbackActionLimiters.clear();
}

// ==================== RESPONSE HELPER ====================

export function createRateLimitResponse(result: RateLimitResult): Response {
  const resetDate = new Date(result.resetTime).toUTCString();

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      resetDate,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': retryAfterSeconds(result).toString(),
      },
    }
  );
}

/**
 * Compute seconds until a rate limit resets.
 * Eliminates the repeated inline Math.ceil((result.resetTime - Date.now()) / 1000).
 */
export function retryAfterSeconds(result: RateLimitResult): number {
  return Math.ceil((result.resetTime - Date.now()) / 1000);
}

/**
 * Standard rate limit headers as a plain record, for callers that build a
 * response from headers rather than mutating one. Same vocabulary as
 * applyRateLimitHeaders — defined once here so the two cannot drift.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'Retry-After': retryAfterSeconds(result).toString(),
  };
}

/**
 * Apply standard rate limit headers to an existing Response.
 */
export function applyRateLimitHeaders<T extends Response>(response: T, result: RateLimitResult): T {
  for (const [name, value] of Object.entries(rateLimitHeaders(result))) {
    response.headers.set(name, value);
  }
  return response;
}
