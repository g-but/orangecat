/**
 * SECURE ERROR HANDLING
 *
 * Prevents information disclosure through error messages.
 */

import { logger } from '../logger';

/**
 * Secure error handling to prevent information disclosure
 */
export class SecureErrorHandler {
  private static sensitivePatterns = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /authorization/i,
    /bearer/i,
    /session/i,
  ];

  /**
   * Sanitize error message for client display
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static sanitizeErrorMessage(error: any): string {
    if (!error) {
      return 'An error occurred';
    }

    let message = typeof error === 'string' ? error : error.message || 'An error occurred';

    // Remove sensitive information
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(message)) {
        return 'Authentication error';
      }
    }

    // Remove stack traces and technical details
    message = message.split('\n')[0]; // Only first line
    message = message.replace(/at\s+.*$/gm, ''); // Remove stack trace hints
    message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]'); // Hide IP addresses

    // Limit message length
    if (message.length > 200) {
      message = 'An error occurred while processing your request';
    }

    return message;
  }

  /**
   * Log error securely (for server-side logging)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static logError(error: any, context: string, userId?: string): void {
    const _sanitizedUserId = userId ? `user:${userId.substring(0, 8)}...` : 'anonymous';
    const _timestamp = new Date().toISOString();

    // In production, this would go to a secure logging service
    logger.error(`Security event logged for ${context}`, {
      message: error.message,
      stack: error.stack,
      // Don't log sensitive request data
    });
  }
}
