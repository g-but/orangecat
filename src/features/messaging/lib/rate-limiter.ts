/**
 * Rate Limiter for Messaging System
 *
 * Simple in-memory rate limiter with sliding window algorithm.
 * For production scale, replace with Redis-based solution (e.g., Upstash).
 *
 * @module messaging/lib/rate-limiter
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

// In-memory store - works for single server instance
// For multi-server deployment, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanupTimer() {
  if (cleanupTimer) {
    return;
  }

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Don't prevent process exit
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

// Default configurations for different actions
export const RATE_LIMIT_CONFIGS = {
  /** Message sending: 60 messages per minute */
  MESSAGE_SEND: { maxRequests: 60, windowMs: 60 * 1000 },

  /** Conversation creation: 10 per minute */
  CONVERSATION_CREATE: { maxRequests: 10, windowMs: 60 * 1000 },

  /** Read receipts: 120 per minute (called frequently) */
  READ_RECEIPT: { maxRequests: 120, windowMs: 60 * 1000 },

  /** Bulk operations: 5 per minute */
  BULK_OPERATION: { maxRequests: 5, windowMs: 60 * 1000 },
} as const;

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** When the rate limit resets (Unix timestamp) */
  resetAt: number;
  /** Milliseconds until reset */
  retryAfterMs: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (usually `action:userId`)
 * @param config - Rate limit configuration
 * @returns Rate limit result with status and metadata
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  startCleanupTimer();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry or window expired - create new
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
      retryAfterMs: 0,
    };
  }

  // Within window - check count
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
      retryAfterMs: 0,
    };
  }

  // Rate limited
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfterMs: entry.resetAt - now,
  };
}

/**
 * Create a rate limit key for a specific action and user
 */
export function createRateLimitKey(
  action: keyof typeof RATE_LIMIT_CONFIGS,
  userId: string
): string {
  return `${action}:${userId}`;
}

/**
 * Convenience function to check rate limit and throw if exceeded
 */
export function enforceRateLimit(
  action: keyof typeof RATE_LIMIT_CONFIGS,
  userId: string
): RateLimitResult {
  const key = createRateLimitKey(action, userId);
  const config = RATE_LIMIT_CONFIGS[action];
  return checkRateLimit(key, config);
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)) }),
  };
}

// For testing - reset the store
export function _resetRateLimitStore(): void {
  rateLimitStore.clear();
}
