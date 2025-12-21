import type { Middleware } from './compose'
import { rateLimit, rateLimitWrite, type RateLimitResult } from '@/lib/rate-limit'
import { apiRateLimited } from './standardResponse'

type Mode = 'read' | 'write'

export function withRateLimit(mode: Mode = 'read'): Middleware<any> {
  return async (req, ctx, next) => {
    let result: RateLimitResult
    if (mode === 'read') {
      result = rateLimit(req)
    } else {
      // If a user is available in ctx, use their id; otherwise fall back to IP-based
      const userId = (ctx as any)?.user?.id
      if (userId) {
        result = rateLimitWrite(userId)
      } else {
        result = rateLimit(req)
      }
    }

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      const res = apiRateLimited('Rate limit exceeded', retryAfter)
      return res
    }

    return next(req, ctx)
  }
}

