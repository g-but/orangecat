/**
 * RATE LIMITING
 *
 * In-memory rate limiting for API endpoints.
 */

/**
 * Rate limiting for API endpoints
 */
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const request = this.requests.get(identifier);

    if (!request || now > request.resetTime) {
      // New window or expired window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (request.count >= this.maxRequests) {
      return false;
    }

    request.count++;
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const request = this.requests.get(identifier);
    if (!request || Date.now() > request.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - request.count);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number {
    const request = this.requests.get(identifier);
    if (!request || Date.now() > request.resetTime) {
      return Date.now() + this.windowMs;
    }
    return request.resetTime;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.requests.forEach((request, key) => {
      if (now > request.resetTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.requests.delete(key));
  }
}

export const apiRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes
