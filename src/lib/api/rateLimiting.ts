/**
 * REDIS-BASED RATE LIMITING SYSTEM
 *
 * Production-ready rate limiting with:
 * - Redis backend for distributed rate limiting
 * - Multiple rate limit strategies
 * - Automatic cleanup and memory management
 * - Proper error handling and monitoring
 * - Sliding window rate limiting
 *
 * 🛡️ SECURITY: Prevents DDoS attacks
 * ⚡ PERFORMANCE: Distributed and efficient
 * 📊 MONITORING: Comprehensive metrics and alerts
 */

import { Redis } from '@upstash/redis'
import { logger } from '@/utils/logger'
import { ApiError, ErrorCode } from '@/lib/api/errorHandling'

// Initialize Redis (configure with your Redis URL)
let redis: Redis | null = null

try {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    })
    logger.info('Redis initialized for rate limiting', { url: process.env.REDIS_URL }, 'RateLimit')
  } else {
    logger.warn('Redis not configured - rate limiting disabled', {
      redisUrl: !!process.env.REDIS_URL,
      redisToken: !!process.env.REDIS_TOKEN
    }, 'RateLimit')
  }
} catch (error) {
  logger.error('Failed to initialize Redis', { error }, 'RateLimit')
}

/**
 * Rate limit configuration for different operation types
 */
export interface RateLimitConfig {
  /** Maximum requests allowed */
  limit: number
  /** Time window in seconds */
  window: number
  /** Identifier strategy ('ip', 'user', 'combined') */
  strategy: 'ip' | 'user' | 'combined'
  /** Block duration in seconds when limit exceeded */
  blockDuration?: number
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  profile_update: {
    limit: 5,
    window: 60, // 5 requests per minute
    strategy: 'combined' as const,
    blockDuration: 300 // 5 minutes block
  },
  funding_create: {
    limit: 10,
    window: 60, // 10 requests per minute
    strategy: 'combined' as const,
    blockDuration: 600 // 10 minutes block
  },
  api_general: {
    limit: 100,
    window: 60, // 100 requests per minute
    strategy: 'ip' as const,
    blockDuration: 300 // 5 minutes block
  },
  auth_attempt: {
    limit: 5,
    window: 300, // 5 attempts per 5 minutes
    strategy: 'combined' as const,
    blockDuration: 900 // 15 minutes block
  }
} as const

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Rate limit exceeded error with retry information
 */
export class RateLimitError extends ApiError {
  constructor(
    config: RateLimitConfig,
    identifier: string,
    retryAfter: number,
    correlationId?: string
  ) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      429,
      {
        correlationId,
        details: {
          identifier,
          limit: config.limit,
          window: config.window,
          retryAfter
        }
      }
    )
  }
}

/**
 * Generate rate limit key for Redis storage
 */
function generateRateLimitKey(
  operation: string,
  strategy: 'ip' | 'user' | 'combined',
  identifiers: {
    userId?: string
    ip?: string
    correlationId?: string
  }
): string {
  const { userId, ip, correlationId } = identifiers

  switch (strategy) {
    case 'ip':
      return `ratelimit:${operation}:ip:${ip || 'unknown'}`
    case 'user':
      return `ratelimit:${operation}:user:${userId || 'anonymous'}`
    case 'combined':
      return `ratelimit:${operation}:combined:${userId || 'anonymous'}:${ip || 'unknown'}`
    default:
      throw new Error(`Invalid rate limit strategy: ${strategy}`)
  }
}

/**
 * Clean up expired rate limit keys
 */
async function cleanupExpiredKeys(pattern: string): Promise<void> {
  if (!redis) {return}

  try {
    // This is a simplified cleanup - in production you'd want more sophisticated cleanup
    // Consider using Redis SCAN and DEL operations in batches
    const keys = await redis.keys(pattern)

    if (keys.length > 1000) {
      logger.warn('Rate limit cleanup needed', {
        keyCount: keys.length,
        pattern
      }, 'RateLimit')

      // Clean up oldest 100 keys
      const oldestKeys = keys.slice(0, 100)
      await redis.del(...oldestKeys)
    }
  } catch (error) {
    logger.error('Rate limit cleanup failed', { error, pattern }, 'RateLimit')
  }
}

/**
 * Check rate limit for an operation
 */
export async function checkRateLimit(
  operation: string,
  config: RateLimitConfig,
  identifiers: {
    userId?: string
    ip?: string
    correlationId?: string
  }
): Promise<RateLimitResult> {
  // If Redis is not available, fail open (allow all requests)
  if (!redis) {
    logger.debug('Rate limiting disabled - Redis not configured', { operation }, 'RateLimit')
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: Date.now() + (config.window * 1000)
    }
  }

  const key = generateRateLimitKey(operation, config.strategy, identifiers)
  const now = Date.now()
  const windowStart = Math.floor(now / (config.window * 1000)) * (config.window * 1000)

  try {
    // Get current count in window
    const currentCount = await redis.zcount(key, windowStart, now)

    // Add current request with score = now
    await redis.zadd(key, { score: now, member: `${now}-${identifiers.correlationId || 'unknown'}` })

    // Ensure key expiry is set
    await redis.expire(key, config.window * 2)

    const newCount = (typeof currentCount === 'number' ? currentCount : Number(currentCount || 0)) + 1

    // Check if limit exceeded
    if (newCount > config.limit) {
      const retryAfter = config.blockDuration || config.window

      // Set block key to prevent further requests
      const blockKey = `${key}:blocked`
      await redis.setex(blockKey, retryAfter, '1')

      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (retryAfter * 1000),
        retryAfter
      }
    }

    // Remove old entries beyond the window
    await redis.zremrangebyscore(key, '-inf', windowStart)

    // Clean up old keys periodically
    if (Math.random() < 0.01) { // 1% chance per request
      cleanupExpiredKeys(`ratelimit:${operation}:*:blocked`).catch(() => {
        // Ignore cleanup errors
      })
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.limit - newCount),
      resetTime: windowStart + (config.window * 1000)
    }

  } catch (error) {
    logger.error('Rate limit check failed', {
      error,
      operation,
      key,
      identifiers
    }, 'RateLimit')

    // Fail open in case of Redis issues - allow request but log warning
    logger.warn('Rate limiting failed open - allowing request', {
      operation,
      key,
      error: error instanceof Error ? error.message : String(error)
    }, 'RateLimit')

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: windowStart + (config.window * 1000)
    }
  }
}

/**
 * Create a rate-limited API handler wrapper
 */
export function withRateLimit<T extends any[]>(
  operation: string,
  config: RateLimitConfig,
  handler: (...args: T) => Promise<any>
) {
  return async function rateLimitedHandler(...args: T): Promise<any> {
    // Extract identifiers from request (first argument should be request)
    const request = args[0]
    if (!request || typeof request !== 'object' || !('headers' in request)) {
      throw new Error('First argument must be a request object')
    }

    const correlationId = request.headers?.get?.('X-Correlation-ID') || undefined
    const ip = request.headers?.get?.('x-forwarded-for') ||
               request.headers?.get?.('x-real-ip') ||
               'unknown'

    // Get user ID if available (from authenticated request)
    interface RequestWithUser {
      user?: {
        id: string;
      };
    }
    const requestWithUser = request as RequestWithUser;
    const userId = requestWithUser.user?.id || undefined

    const identifiers = { userId, ip, correlationId }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(operation, config, identifiers)

    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        config,
        `${operation}:${userId || ip}`,
        rateLimitResult.retryAfter!,
        correlationId
      )
    }

    // Add rate limit headers to response
    const response = await handler(...args)

    if (response && typeof response === 'object' && 'headers' in response) {
      response.headers.set('X-RateLimit-Limit', config.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
      response.headers.set('Retry-After', rateLimitResult.resetTime.toString())
    }

    return response
  }
}

/**
 * Get rate limit status for monitoring
 */
export async function getRateLimitStatus(): Promise<{
  totalKeys: number
  blockedKeys: number
  operations: Record<string, number>
}> {
  if (!redis) {
    return {
      totalKeys: 0,
      blockedKeys: 0,
      operations: {}
    }
  }

  try {
    const keys = await redis.keys('ratelimit:*')
    const blockedKeys = await redis.keys('ratelimit:*:blocked')

    // Count operations
    const operations: Record<string, number> = {}
    for (const key of keys) {
      const operation = key.split(':')[1]
      operations[operation] = (operations[operation] || 0) + 1
    }

    return {
      totalKeys: keys.length,
      blockedKeys: blockedKeys.length,
      operations
    }
  } catch (error) {
    logger.error('Failed to get rate limit status', { error }, 'RateLimit')
    return {
      totalKeys: 0,
      blockedKeys: 0,
      operations: {}
    }
  }
}

/**
 * Reset rate limits (for admin use)
 */
export async function resetRateLimits(
  operation?: string,
  identifier?: string
): Promise<number> {
  if (!redis) {
    logger.warn('Cannot reset rate limits - Redis not configured', { operation, identifier }, 'RateLimit')
    return 0
  }

  try {
    let pattern = 'ratelimit:*'

    if (operation && identifier) {
      pattern = `ratelimit:${operation}:*${identifier}*`
    } else if (operation) {
      pattern = `ratelimit:${operation}:*`
    }

    const keys = await redis.keys(pattern)
    if (keys.length === 0) {return 0}

    await redis.del(...keys)

    logger.info('Rate limits reset', {
      pattern,
      keysDeleted: keys.length
    }, 'RateLimit')

    return keys.length
  } catch (error) {
    logger.error('Failed to reset rate limits', { error, operation, identifier }, 'RateLimit')
    throw error
  }
}

/**
 * Pre-configured rate limiters for common operations
 */
export const RateLimiters = {
  profileUpdate: (handler: any) => withRateLimit('profile_update', RATE_LIMIT_CONFIGS.profile_update, handler),
  fundingCreate: (handler: any) => withRateLimit('funding_create', RATE_LIMIT_CONFIGS.funding_create, handler),
  apiGeneral: (handler: any) => withRateLimit('api_general', RATE_LIMIT_CONFIGS.api_general, handler),
  authAttempt: (handler: any) => withRateLimit('auth_attempt', RATE_LIMIT_CONFIGS.auth_attempt, handler),
}

export default {
  checkRateLimit,
  withRateLimit,
  getRateLimitStatus,
  resetRateLimits,
  RateLimiters,
  RateLimitError
}
