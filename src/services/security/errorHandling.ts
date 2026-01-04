/**
 * Secure Error Handling Module
 *
 * Provides error sanitization and security event logging
 * to prevent information disclosure in production.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from security-hardening.ts
 */

import { logger } from '@/utils/logger';

export class SecureErrorHandler {
  /**
   * Sanitize error messages to prevent information disclosure
   */
  static sanitizeError(
    error: any,
    isProduction: boolean = process.env.NODE_ENV === 'production'
  ): {
    message: string;
    code?: string;
    details?: any;
  } {
    // In production, never expose internal errors
    if (isProduction) {
      const safeErrors = [
        'Invalid credentials',
        'Access denied',
        'Resource not found',
        'Invalid input',
        'Rate limit exceeded',
        'File too large',
        'Invalid file type',
      ];

      const errorMessage = error?.message || 'An error occurred';
      const isSafeError = safeErrors.some(safe => errorMessage.includes(safe));

      return {
        message: isSafeError ? errorMessage : 'An error occurred',
        code: error?.code || 'INTERNAL_ERROR',
      };
    }

    // In development, provide more details but still sanitize
    return {
      message: error?.message || 'An error occurred',
      code: error?.code,
      details: error?.stack ? error.stack.split('\n').slice(0, 3) : undefined,
    };
  }

  /**
   * Log security events
   */
  static logSecurityEvent(
    event: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const logData = {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details,
    };

    if (severity === 'critical' || severity === 'high') {
      logger.error(`Security Event: ${event}`, logData, 'Security');
    } else {
      logger.warn(`Security Event: ${event}`, logData, 'Security');
    }
  }
}


