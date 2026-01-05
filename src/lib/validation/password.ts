/**
 * Centralized Password Validation
 *
 * Single source of truth for all password validation rules and schemas.
 * Eliminates duplicate validation logic across the codebase.
 *
 * Created: 2026-01-30
 * Last Modified: 2026-01-30
 * Last Modified Summary: Created centralized password validation to eliminate DRY violations
 */

import * as z from 'zod';

/**
 * Password validation rules - Single Source of Truth
 */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
} as const;

/**
 * Common weak passwords that should be rejected
 */
const COMMON_PASSWORDS = [
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
] as const;

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password strength against security requirements
 *
 * This is the SINGLE SOURCE OF TRUTH for password validation.
 * All password validation should use this function.
 *
 * @param password - Password to validate
 * @returns Validation result with detailed error messages
 *
 * @example
 * ```typescript
 * const result = validatePasswordStrength('MyP@ssw0rd');
 * if (!result.valid) {
 *   console.log('Password errors:', result.errors);
 * }
 * ```
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  // Length validation
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
  }
  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_RULES.maxLength} characters`);
  }

  // Character requirements
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (PASSWORD_RULES.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase() as typeof COMMON_PASSWORDS[number])) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Zod schema for password validation
 *
 * Use this schema in form validation to ensure consistency.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   password: passwordSchema,
 *   confirmPassword: z.string(),
 * }).refine(data => data.password === data.confirmPassword, {
 *   message: "Passwords don't match",
 *   path: ['confirmPassword'],
 * });
 * ```
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.minLength, `Password must be at least ${PASSWORD_RULES.minLength} characters`)
  .max(PASSWORD_RULES.maxLength, `Password must be less than ${PASSWORD_RULES.maxLength} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  .refine(
    password => !COMMON_PASSWORDS.includes(password.toLowerCase() as typeof COMMON_PASSWORDS[number]),
    {
      message: 'Password is too common. Please choose a more unique password',
    }
  );

/**
 * Simple boolean check for password validity
 *
 * Use this for quick validation checks without detailed error messages.
 *
 * @param password - Password to validate
 * @returns True if password meets all requirements
 */
export function isValidPassword(password: string): boolean {
  const result = validatePasswordStrength(password);
  return result.valid;
}
