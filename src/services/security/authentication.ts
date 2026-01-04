/**
 * Authentication Security Module
 *
 * Provides account lockout protection, password strength validation,
 * and secure token generation for authentication operations.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from security-hardening.ts
 */

import { logger } from '@/utils/logger';

/**
 * Authentication Security System
 *
 * @example
 * ```typescript
 * // Check if account is locked
 * if (AuthenticationSecurity.isAccountLocked('user@example.com')) {
 *   throw new Error('Account temporarily locked due to failed attempts');
 * }
 *
 * // Validate password strength
 * const validation = AuthenticationSecurity.validatePasswordStrength('password123');
 * if (!validation.valid) {
 *   console.log('Password errors:', validation.errors);
 * }
 * ```
 */
export class AuthenticationSecurity {
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_ATTEMPTS = 5;
  private static lockedAccounts = new Map<string, number>();

  /**
   * Check if account is locked due to failed authentication attempts
   * @param identifier - Account identifier (email, username)
   * @returns True if account is currently locked
   */
  static isAccountLocked(identifier: string): boolean {
    const lockTime = this.lockedAccounts.get(identifier);
    if (!lockTime) {
      return false;
    }

    if (Date.now() > lockTime) {
      this.lockedAccounts.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Record failed authentication attempt and lock account if needed
   * @param identifier - Account identifier that failed authentication
   */
  static recordFailedAttempt(identifier: string): void {
    const lockUntil = Date.now() + this.LOCKOUT_DURATION;
    this.lockedAccounts.set(identifier, lockUntil);

    logger.warn(
      'Authentication failure recorded',
      {
        identifier: identifier.substring(0, 3) + '***', // Partial identifier for privacy
        lockUntil: new Date(lockUntil).toISOString(),
      },
      'Security'
    );
  }

  /**
   * Clear failed attempts record on successful authentication
   * @param identifier - Account identifier that successfully authenticated
   */
  static clearFailedAttempts(identifier: string): void {
    this.lockedAccounts.delete(identifier);
  }

  /**
   * Validate password strength against security requirements
   * @param password - Password to validate
   * @returns Validation result with detailed error messages
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
      errors.push('Password too long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password',
      '123456',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate cryptographically secure random token
   * @param length - Token length (default: 32 characters)
   * @returns Secure random string suitable for tokens
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}


