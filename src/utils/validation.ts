/**
 * VALIDATION UTILITIES - INPUT VALIDATION AND SANITIZATION
 *
 * This module provides comprehensive validation functions for user inputs,
 * Bitcoin addresses, email addresses, and other data types used in the application.
 *
 * Created: 2025-01-22
 * Last Modified: 2025-01-22
 * Last Modified Summary: Comprehensive validation utilities for Bitcoin and user data
 */

// Bitcoin address validation patterns
const BITCOIN_ADDRESS_PATTERNS = {
  // Legacy addresses (P2PKH): Start with 1, length 26-35
  legacy: /^1[A-HJ-NP-Z0-9]{25,34}$/,

  // SegWit addresses (P2SH): Start with 3, length 26-35
  segwit: /^3[A-HJ-NP-Z0-9]{25,34}$/,

  // Bech32 addresses (P2WPKH/P2WSH): Start with bc1, length 14-74
  bech32: /^bc1[a-z0-9]{8,87}$/,

  // Testnet legacy: Start with m or n
  testnetLegacy: /^[mn][A-HJ-NP-Z0-9]{25,34}$/,

  // Testnet SegWit: Start with 2
  testnetSegwit: /^2[A-HJ-NP-Z0-9]{25,34}$/,

  // Testnet Bech32: Start with tb1
  testnetBech32: /^tb1[a-z0-9]{8,87}$/,
};

// Lightning Network invoice validation
const LIGHTNING_INVOICE_PATTERN = /^lnbc[a-z0-9]+$/i;

// Email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation pattern (alphanumeric, underscore, dash, 3-30 chars)
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

// URL validation pattern
const URL_PATTERN =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// UUID validation pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * @param value - String to validate as UUID
 * @returns boolean indicating if value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  return UUID_PATTERN.test(value.trim());
}

/**
 * Validate Bitcoin address format
 * @param address - Bitcoin address to validate
 * @param allowTestnet - Whether to allow testnet addresses
 * @returns boolean indicating if address is valid
 */
export function isValidBitcoinAddress(address: string, allowTestnet: boolean = false): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmed = address.trim();

  if (allowTestnet) {
    return (
      BITCOIN_ADDRESS_PATTERNS.legacy.test(trimmed) ||
      BITCOIN_ADDRESS_PATTERNS.segwit.test(trimmed) ||
      BITCOIN_ADDRESS_PATTERNS.bech32.test(trimmed) ||
      BITCOIN_ADDRESS_PATTERNS.testnetLegacy.test(trimmed) ||
      BITCOIN_ADDRESS_PATTERNS.testnetSegwit.test(trimmed) ||
      BITCOIN_ADDRESS_PATTERNS.testnetBech32.test(trimmed)
    );
  } else {
    return (
      BITCOIN_ADDRESS_PATTERNS.legacy.test(trimmed) ||
      BITCOIN_ADDRESS_PATTERNS.segwit.test(trimmed) ||
      BITCOIN_ADDRESS_PATTERNS.bech32.test(trimmed)
    );
  }
}

/**
 * Validate Lightning Network invoice
 * @param invoice - Lightning invoice to validate
 * @returns boolean indicating if invoice is valid
 */
export function isValidLightningAddress(invoice: string): boolean {
  if (!invoice || typeof invoice !== 'string') {
    return false;
  }

  return LIGHTNING_INVOICE_PATTERN.test(invoice.trim());
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  return EMAIL_PATTERN.test(email.trim());
}

/**
 * Validate username format
 * @param username - Username to validate
 * @returns boolean indicating if username is valid
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  return USERNAME_PATTERN.test(username.trim());
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return URL_PATTERN.test(url.trim());
}

/**
 * Sanitize string input by trimming and removing dangerous characters
 * @param input - String to sanitize
 * @returns sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 1000); // Limit length
}

/**
 * Validate project goal amount
 * @param amount - Amount to validate (in satoshis)
 * @returns boolean indicating if amount is valid
 */
export function isValidGoalAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }

  // Must be positive and reasonable (max 1 BTC = 100,000,000 sats)
  return amount > 0 && amount <= 100000000;
}

/**
 * Validate Bitcoin amount format
 * @param amount - Amount string to validate (e.g., "0.001", "100 sats")
 * @returns boolean indicating if amount format is valid
 */
export function isValidBitcoinAmount(amount: string): boolean {
  if (!amount || typeof amount !== 'string') {
    return false;
  }

  const trimmed = amount.trim().toLowerCase();

  // Check for BTC format (e.g., "0.001", "1.5")
  const btcPattern = /^\d+(\.\d{1,8})?$/;
  if (btcPattern.test(trimmed)) {
    const num = parseFloat(trimmed);
    return num > 0 && num <= 21e6; // Max 21 million BTC
  }

  // Check for sats format (e.g., "100000 sats", "50000sats")
  const satsPattern = /^\d+\s*sats?$/i;
  if (satsPattern.test(trimmed)) {
    const num = parseInt(trimmed.replace(/\s*sats?$/i, ''));
    return num > 0 && num <= 21e6 * 1e8; // Max 21 million BTC in sats
  }

  return false;
}

/**
 * Validate project title
 * @param title - Project title to validate
 * @returns boolean indicating if title is valid
 */
export function isValidProjectTitle(title: string): boolean {
  if (!title || typeof title !== 'string') {
    return false;
  }

  const trimmed = title.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}

/**
 * Validate project description
 * @param description - Project description to validate
 * @returns boolean indicating if description is valid
 */
export function isValidProjectDescription(description: string): boolean {
  if (!description || typeof description !== 'string') {
    return false;
  }

  const trimmed = description.trim();
  return trimmed.length >= 10 && trimmed.length <= 5000;
}

/**
 * Validate bio text
 * @param bio - Bio text to validate
 * @returns boolean indicating if bio is valid
 */
export function isValidBio(bio: string): boolean {
  if (!bio || typeof bio !== 'string') {
    return false;
  }

  const trimmed = bio.trim();
  return trimmed.length <= 500;
}

/**
 * @deprecated Use isValidPassword() from @/lib/validation/password instead.
 * 
 * This function is deprecated in favor of centralized password validation.
 * Re-exported for backward compatibility.
 *
 * Last Modified: 2026-01-30
 * Last Modified Summary: Deprecated - re-exports from centralized password validation
 */
export { isValidPassword } from '@/lib/validation/password';

/**
 * Type guard for AuthError
 * @param error - Error object to check
 * @returns boolean indicating if error is an AuthError
 */
export function isAuthError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
): error is { message: string; name?: string; status?: number } {
  return error && typeof error === 'object' && 'message' in error;
}

// Export additional validation functions that might be expected by tests
export {
  isValidBitcoinAddress as validateBitcoinAddress,
  isValidLightningAddress as validateLightningAddress,
  isValidEmail as validateEmail,
  isValidUsername as validateUsername,
  isValidUrl as validateUrl,
  sanitizeString as sanitizeInput,
};
