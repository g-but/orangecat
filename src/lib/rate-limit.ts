/**
 * RATE LIMITING UTILITY
 *
 * Provides basic rate limiting for API endpoints to prevent abuse.
 * In production, consider using Redis or a dedicated rate limiting service.
 */

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

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private windowMs: number;
  private maxRequests: number;

  constructor(config?: RateLimitConfig) {
    this.windowMs = config?.windowMs || 15 * 60 * 1000; // 15 minutes default
    this.maxRequests = config?.maxRequests || 100; // 100 requests default
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const existing = this.requests.get(key);

    // Clean up expired entries
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

// Default rate limiter for general API requests
const rateLimiter = new RateLimiter();

// Strict rate limiter for social actions (follow/unfollow)
const socialRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 follow/unfollow actions per minute
});

// Medium rate limiter for write operations
const writeRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 writes per minute
});

export function rateLimit(request: RequestLike): RateLimitResult {
  // Use IP address as the key (in production, get real IP from headers)
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  return rateLimiter.check(`api:${ip}`);
}

/**
 * Rate limit for social actions (follow, unfollow)
 * Stricter limits to prevent spam
 */
export function rateLimitSocial(userId: string): RateLimitResult {
  return socialRateLimiter.check(`social:${userId}`);
}

/**
 * Rate limit for write operations (create, update, delete)
 */
export function rateLimitWrite(userId: string): RateLimitResult {
  return writeRateLimiter.check(`write:${userId}`);
}

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
