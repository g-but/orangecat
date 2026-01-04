/**
 * Security Middleware Module
 *
 * Comprehensive security hardening middleware for API routes.
 * Orchestrates all security checks: method validation, rate limiting,
 * authentication, input validation, and security event monitoring.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from security-hardening.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimiter } from './rateLimiting';
import { SecurityMonitor } from './monitoring';

/**
 * Comprehensive Security Hardening Middleware
 *
 * Provides complete security protection for API routes including:
 * - Method validation
 * - Rate limiting
 * - Authentication verification
 * - Input validation
 * - Security event monitoring
 *
 * @example
 * ```typescript
 * // Secure an API route
 * const security = await SecurityHardening.secureAPIRoute(request, {
 *   requireAuth: true,
 *   rateLimit: 'api',
 *   allowedMethods: ['POST'],
 *   validateInput: userUpdateSchema
 * });
 *
 * if (!security.success) {
 *   return security.response; // Security check failed
 * }
 *
 * // Security passed, proceed with API logic
 * const user = security.user;
 * ```
 */
export class SecurityHardening {
  /**
   * Apply comprehensive security protection to API routes
   * @param request - Next.js request object
   * @param options - Security configuration options
   * @param options.requireAuth - Whether authentication is required
   * @param options.rateLimit - Rate limit type to apply
   * @param options.validateInput - Zod schema for input validation
   * @param options.allowedMethods - HTTP methods allowed for this route
   * @returns Security check result with user data or error response
   */
  static async secureAPIRoute(
    request: NextRequest,
    options: {
      requireAuth?: boolean;
      rateLimit?: keyof typeof RateLimiter.LIMITS;
      validateInput?: z.ZodSchema;
      allowedMethods?: string[];
    } = {}
  ): Promise<{ success: true; user?: any } | { success: false; response: NextResponse }> {
    try {
      const {
        requireAuth = true,
        rateLimit = 'api',
        validateInput,
        allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
      } = options;

      // 1. Method validation
      if (!allowedMethods.includes(request.method)) {
        SecurityMonitor.recordEvent('invalid_method', 'medium', {
          method: request.method,
          url: request.url,
        });

        return {
          success: false,
          response: NextResponse.json({ error: 'Method not allowed' }, { status: 405 }),
        };
      }

      // 2. Rate limiting
      const clientIP =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const rateLimitResult = await RateLimiter.checkLimit(clientIP, rateLimit);

      if (!rateLimitResult.allowed) {
        SecurityMonitor.recordEvent('rate_limit_exceeded', 'high', {
          ip: clientIP,
          limitType: rateLimit,
        });

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: {
                'Retry-After': Math.ceil(
                  (rateLimitResult.resetTime - Date.now()) / 1000
                ).toString(),
              },
            }
          ),
        };
      }

      // 3. Authentication check
      let user = null;
      if (requireAuth) {
        try {
          // Only import and use createServerClient when actually needed
          const { createServerClient: createClient } = await import('@/lib/supabase/server');
          const supabase = await createClient();
          const {
            data: { user: authUser },
            error: authError,
          } = await supabase.auth.getUser();

          if (!authUser || authError) {
            SecurityMonitor.recordEvent('unauthorized_access', 'medium', {
              ip: clientIP,
              url: request.url,
            });

            return {
              success: false,
              response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
            };
          }

          user = authUser;
        } catch (authError) {
          SecurityMonitor.recordEvent('auth_error', 'high', {
            ip: clientIP,
            error: (authError as Error).message,
          });

          return {
            success: false,
            response: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
          };
        }
      }

      // 4. Input validation
      if (validateInput && request.method !== 'GET') {
        try {
          const body = await request.json();
          validateInput.parse(body);
        } catch (validationError) {
          SecurityMonitor.recordEvent('input_validation_failed', 'medium', {
            ip: clientIP,
            error: (validationError as Error).message,
          });

          return {
            success: false,
            response: NextResponse.json({ error: 'Invalid input data' }, { status: 400 }),
          };
        }
      }

      return { success: true, user };
    } catch (error) {
      SecurityMonitor.recordEvent('security_middleware_error', 'critical', {
        error: (error as Error).message,
      });

      return {
        success: false,
        response: NextResponse.json({ error: 'Security validation failed' }, { status: 500 }),
      };
    }
  }
}


