/**
 * Rate Limiting Module
 *
 * Implements sliding window rate limiting to prevent abuse and DoS attacks.
 * Supports different rate limits for different operation types.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from security-hardening.ts
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate Limiting System for API Protection
 *
 * @example
 * ```typescript
 * const result = await RateLimiter.checkLimit('user@example.com', 'auth');
 * if (!result.allowed) {
 *   throw new Error(`Rate limit exceeded. Try again in ${result.resetTime - Date.now()}ms`);
 * }
 * ```
 */
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  static readonly LIMITS: Record<string, RateLimitConfig> = {
    // API rate limits
    api: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 auth attempts per 15 minutes
    upload: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 uploads per minute
    search: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 searches per minute

    // Strict limits for sensitive operations
    passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
    profileUpdate: { windowMs: 5 * 60 * 1000, maxRequests: 10 }, // 10 per 5 minutes
  };

  /**
   * Check if request is within rate limits
   * @param identifier - Unique identifier (IP, user ID, email)
   * @param limitType - Type of rate limit to apply
   * @returns Rate limit status with remaining requests and reset time
   */
  static async checkLimit(
    identifier: string,
    limitType: keyof typeof RateLimiter.LIMITS
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = this.LIMITS[limitType];
    const now = Date.now();
    const key = `${limitType}:${identifier}`;

    // Clean up expired entries
    this.cleanup();

    const existing = this.requests.get(key);

    if (!existing || now > existing.resetTime) {
      // New window
      this.requests.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
      };
    }

    existing.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetTime: existing.resetTime,
    };
  }

  private static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  static getStats(): { totalKeys: number; activeWindows: number } {
    this.cleanup();
    return {
      totalKeys: this.requests.size,
      activeWindows: this.requests.size,
    };
  }
}


