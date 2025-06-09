/**
 * SECURITY MIDDLEWARE - API Route Protection
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Security middleware for comprehensive API protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  apiRateLimiter, 
  authRateLimiter, 
  SecurityMonitor, 
  SecureErrorHandler,
  CSPHelper,
  AuthSecurity
} from '@/utils/security'

// ==================== MIDDLEWARE TYPES ====================

interface SecurityConfig {
  requireAuth?: boolean
  rateLimitKey?: 'api' | 'auth'
  allowedMethods?: string[]
  requireHttps?: boolean
  validateOrigin?: boolean
  logActivity?: boolean
}

interface SecurityContext {
  userId?: string
  ip: string
  userAgent: string
  origin?: string
  method: string
  path: string
}

// ==================== SECURITY MIDDLEWARE ====================

export class SecurityMiddleware {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  /**
   * Main security middleware function
   */
  static async secure(
    request: NextRequest,
    config: SecurityConfig = {}
  ): Promise<NextResponse | null> {
    const context = this.extractContext(request)

    try {
      const headers = CSPHelper.getSecurityHeaders()

      // Method validation
      if (config.allowedMethods && !config.allowedMethods.includes(context.method)) {
        SecurityMonitor.logEvent('method_not_allowed', 'low', context)
        return new NextResponse('Method Not Allowed', { 
          status: 405,
          headers: {
            ...headers,
            'Allow': config.allowedMethods.join(', ')
          }
        })
      }

      // Rate limiting
      const rateLimitResult = this.checkRateLimit(context, config.rateLimitKey)
      if (!rateLimitResult.allowed) {
        SecurityMonitor.logEvent('rate_limit_exceeded', 'medium', context)
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': '900'
          }
        })
      }

      // Activity logging
      if (config.logActivity) {
        SecurityMonitor.logEvent('api_access', 'low', context)
      }

      return null // Allow request to proceed

    } catch (error) {
      const sanitizedError = SecureErrorHandler.sanitizeErrorMessage(error)
      SecurityMonitor.logEvent('middleware_error', 'high', {
        ...context,
        error: sanitizedError
      })

      return new NextResponse('Internal Server Error', { 
        status: 500,
        headers: CSPHelper.getSecurityHeaders()
      })
    }
  }

  /**
   * Extract security context from request
   */
  private static extractContext(request: NextRequest): SecurityContext {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'

    return {
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      origin: request.headers.get('origin') || undefined,
      method: request.method,
      path: request.nextUrl.pathname
    }
  }

  /**
   * Check if HTTPS should be enforced
   */
  private static shouldEnforceHttps(request: NextRequest): boolean {
    // Don't enforce HTTPS in development
    if (process.env.NODE_ENV === 'development') return false
    
    // Check if request is already HTTPS
    const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol
    return protocol !== 'https:'
  }

  /**
   * Check if origin is allowed
   */
  private static isOriginAllowed(origin?: string): boolean {
    if (!origin) return true // Allow requests without origin (Postman, etc.)

    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      'https://localhost:3000',
      'https://orangecat.fund',
      'https://www.orangecat.fund'
    ].filter(Boolean)

    return allowedOrigins.some(allowed => {
      if (!allowed) return false
      try {
        const allowedUrl = new URL(allowed)
        const originUrl = new URL(origin)
        return allowedUrl.hostname === originUrl.hostname
      } catch {
        return false
      }
    })
  }

  /**
   * Check rate limits
   */
  private static checkRateLimit(
    context: SecurityContext, 
    type: SecurityConfig['rateLimitKey'] = 'api'
  ): { allowed: boolean } {
    const limiter = type === 'auth' ? authRateLimiter : apiRateLimiter
    const identifier = `${context.ip}:${type}`
    
    return { allowed: limiter.isAllowed(identifier) }
  }

  /**
   * Check authentication
   */
  private static async checkAuthentication(request: NextRequest): Promise<{
    authenticated: boolean
    userId?: string
    error?: string
  }> {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authenticated: false, error: 'Missing or invalid authorization header' }
      }

      const token = authHeader.substring(7)
      const { data: { user }, error } = await this.supabase.auth.getUser(token)

      if (error || !user) {
        return { authenticated: false, error: 'Invalid token' }
      }

      return { authenticated: true, userId: user.id }

    } catch (error) {
      return { authenticated: false, error: 'Authentication error' }
    }
  }

  /**
   * Create security configuration for different route types
   */
  static configs = {
    public: {
      requireAuth: false,
      rateLimitKey: 'api' as const,
      allowedMethods: ['GET', 'POST'],
      logActivity: false
    },

    protected: {
      requireAuth: true,
      rateLimitKey: 'api' as const,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      requireHttps: true,
      validateOrigin: true,
      logActivity: true
    },

    auth: {
      requireAuth: false,
      rateLimitKey: 'auth' as const,
      allowedMethods: ['POST'],
      requireHttps: true,
      validateOrigin: true,
      logActivity: true
    },

    upload: {
      requireAuth: true,
      rateLimitKey: 'api' as const,
      allowedMethods: ['POST', 'PUT'],
      requireHttps: true,
      validateOrigin: true,
      logActivity: true
    }
  }
}

// ==================== CONVENIENCE WRAPPERS ====================

/**
 * Secure public API routes
 */
export async function securePublicRoute(request: NextRequest) {
  return SecurityMiddleware.secure(request, SecurityMiddleware.configs.public)
}

/**
 * Secure protected API routes
 */
export async function secureProtectedRoute(request: NextRequest) {
  return SecurityMiddleware.secure(request, SecurityMiddleware.configs.protected)
}

/**
 * Secure authentication routes
 */
export async function secureAuthRoute(request: NextRequest) {
  return SecurityMiddleware.secure(request, SecurityMiddleware.configs.auth)
}

/**
 * Secure file upload routes
 */
export async function secureUploadRoute(request: NextRequest) {
  return SecurityMiddleware.secure(request, SecurityMiddleware.configs.upload)
}

// ==================== ROUTE PROTECTION DECORATOR ====================

/**
 * Decorator for protecting API route handlers
 */
export function withSecurityProtection(
  config: SecurityConfig = SecurityMiddleware.configs.protected
) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      // Apply security middleware
      const securityResult = await SecurityMiddleware.secure(request, config)
      
      // If security middleware returns a response, return it (blocked request)
      if (securityResult && securityResult.status !== 200) {
        return securityResult
      }

      try {
        // Call the original handler
        const response = await handler(request)
        
        // Add security headers to response if not already present
        const securityHeaders = CSPHelper.getSecurityHeaders()
        Object.entries(securityHeaders).forEach(([key, value]) => {
          if (!response.headers.has(key)) {
            response.headers.set(key, value)
          }
        })

        return response

      } catch (error) {
        const sanitizedError = SecureErrorHandler.sanitizeErrorMessage(error)
        SecureErrorHandler.logError(error, 'api_handler')
        
        SecurityMonitor.logEvent('api_error', 'high', {
          path: request.nextUrl.pathname,
          method: request.method,
          error: sanitizedError
        })

        return new NextResponse(
          JSON.stringify({ error: sanitizedError }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...CSPHelper.getSecurityHeaders()
            }
          }
        )
      }
    }
  }
}

// ==================== SECURITY CONTEXT HELPER ====================

/**
 * Extract security context from request headers
 */
export function getSecurityContext(request: NextRequest): SecurityContext | null {
  try {
    const contextHeader = request.headers.get('x-security-context')
    if (!contextHeader) return null
    
    return JSON.parse(contextHeader) as SecurityContext
  } catch {
    return null
  }
} 