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

export interface RateLimitConfig {
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
      console.warn(
        '[Rate Limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN not configured. ' +
          'Rate limiting will use in-memory fallback which does NOT work correctly in serverless.'
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

// ==================== RATE LIMIT FUNCTIONS ====================

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
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
  const key = `api:${ip}`;

  if (upstashGeneralLimiter) {
    const result = await upstashGeneralLimiter.limit(key);
    return toRateLimitResult(result);
  }

  return fallbackGeneralLimiter.check(key);
}

/**
 * Synchronous version for backward compatibility
 * Uses in-memory fallback (not recommended for production)
 */
export function rateLimitSync(request: RequestLike): RateLimitResult {
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
  return fallbackGeneralLimiter.check(`api:${ip}`);
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
 * Synchronous social rate limit (backward compatibility)
 */
export function rateLimitSocial(userId: string): RateLimitResult {
  return fallbackSocialLimiter.check(`social:${userId}`);
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
 * Synchronous write rate limit (backward compatibility)
 */
export function rateLimitWrite(userId: string): RateLimitResult {
  return fallbackWriteLimiter.check(`write:${userId}`);
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
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Apply standard rate limit headers to an existing Response.
 */
export function applyRateLimitHeaders<T extends Response>(
  response: T,
  result: RateLimitResult
): T {
  const headers = response.headers;
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toString());
  headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
  return response;
}

// ==================== STATUS CHECK ====================

/**
 * Check if production rate limiting is configured
 */
export function isProductionRateLimitingEnabled(): boolean {
  return redis !== null;
}
