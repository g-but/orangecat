/**
 * SECURITY VALIDATION WRAPPER
 *
 * Higher-order function for secure API route handling with
 * rate limiting, validation, auth checks, and monitoring.
 */

import { z } from 'zod';
import { RateLimiter } from './rate-limiting';
import { SecurityMonitor } from './monitoring';
import { SecureErrorHandler } from './error-handling';

/**
 * Wrapper for secure API route handling
 */
export function withSecurity<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (data: T) => Promise<any>,
  schema: z.ZodSchema<T>,
  options: {
    rateLimiter?: RateLimiter;
    requireAuth?: boolean;
    logActivity?: boolean;
  } = {}
) {
  return async (data: unknown, context?: { userId?: string; ip?: string }) => {
    try {
      // Rate limiting
      if (options.rateLimiter && context?.ip) {
        if (!options.rateLimiter.isAllowed(context.ip)) {
          SecurityMonitor.logEvent('rate_limit_exceeded', 'medium', {
            ip: context.ip,
            userId: context.userId,
          });
          throw new Error('Rate limit exceeded');
        }
      }

      // Validation
      const validatedData = schema.parse(data);

      // Authentication check
      if (options.requireAuth && !context?.userId) {
        SecurityMonitor.logEvent('unauthorized_access', 'high', {
          ip: context?.ip,
          data: typeof data,
        });
        throw new Error('Authentication required');
      }

      // Log activity
      if (options.logActivity) {
        SecurityMonitor.logEvent('api_access', 'low', {
          userId: context?.userId,
          ip: context?.ip,
          endpoint: 'api_call',
        });
      }

      // Execute handler
      return await handler(validatedData);
    } catch (error) {
      const sanitizedError = SecureErrorHandler.sanitizeErrorMessage(error);
      SecureErrorHandler.logError(error, 'api_handler', context?.userId);

      SecurityMonitor.logEvent('api_error', 'medium', {
        error: sanitizedError,
        userId: context?.userId,
        ip: context?.ip,
      });

      throw new Error(sanitizedError);
    }
  };
}
