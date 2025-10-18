/**
 * RATE LIMITING UTILITY
 *
 * Provides basic rate limiting for API endpoints to prevent abuse.
 * In production, consider using Redis or a dedicated rate limiting service.
 */

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

interface RequestLike {
  headers: {
    get(name: string): string | null
  }
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  private windowMs = 15 * 60 * 1000 // 15 minutes
  private maxRequests = 100 // requests per window

  check(key: string): RateLimitResult {
    const now = Date.now()
    const existing = this.requests.get(key)

    // Clean up expired entries
    if (existing && now > existing.resetTime) {
      this.requests.delete(key)
    }

    const entry = this.requests.get(key) || { count: 0, resetTime: now + this.windowMs }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    entry.count++
    this.requests.set(key, entry)

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }
}

const rateLimiter = new RateLimiter()

export function rateLimit(request: RequestLike): RateLimitResult {
  // Use IP address as the key (in production, get real IP from headers)
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             '127.0.0.1'

  return rateLimiter.check(`api:${ip}`)
}

export function createRateLimitResponse(result: RateLimitResult): Response {
  const resetDate = new Date(result.resetTime).toUTCString()

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      resetDate
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
      }
    }
  )
}
