import type { Middleware } from './compose'
import { rateLimit, rateLimitWrite, type RateLimitResult } from '@/lib/rate-limit'
import { apiRateLimited } from './standardResponse'

type Mode = 'read' | 'write'

interface ContextWithUser {
  user?: {
    id: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withRateLimit(mode: Mode = 'read'): Middleware<any> {
  return async (req, ctx, next) => {
    let result: RateLimitResult
    if (mode === 'read') {
      result = await rateLimit(req)
    } else {
      // If a user is available in ctx, use their id; otherwise fall back to IP-based
      const ctxWithUser = ctx as ContextWithUser | undefined;
      const userId = ctxWithUser?.user?.id
      if (userId) {
        result = await rateLimitWrite(userId)
      } else {
        result = await rateLimit(req)
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

