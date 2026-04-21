/**
 * AUTHENTICATION SECURITY
 *
 * Login attempt tracking, account lockout, password strength validation,
 * and secure token generation.
 */

/**
 * Authentication security utilities
 */
export class AuthSecurity {
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Check if account is locked due to failed attempts
   */
  static isAccountLocked(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) {
      return false;
    }

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt > this.LOCKOUT_DURATION) {
      // Reset attempts after lockout period
      this.loginAttempts.delete(identifier);
      return false;
    }

    return attempts.count >= this.MAX_ATTEMPTS;
  }

  /**
   * Record a failed login attempt
   */
  static recordFailedAttempt(identifier: string): void {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(identifier, attempts);
  }

  /**
   * Clear failed attempts for successful login
   */
  static clearFailedAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier);
  }

  /**
   * Get remaining attempts before lockout
   */
  static getRemainingAttempts(identifier: string): number {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) {
      return this.MAX_ATTEMPTS;
    }

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt > this.LOCKOUT_DURATION) {
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - attempts.count);
  }

  /**
   * Generate secure session token
   */
  static generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use at least 8 characters');
    }

    if (password.length >= 12) {
      score += 1;
    } else {
      feedback.push('Consider using 12+ characters for better security');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    // Check for common patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123|abc|qwe/i, // Sequential patterns
      /password|admin|user/i, // Common words
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score -= 1;
        feedback.push('Avoid common patterns and dictionary words');
        break;
      }
    }

    return {
      valid: score >= 4,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }
}
