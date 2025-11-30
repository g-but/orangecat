/**
 * Wallet Management Constants
 *
 * Centralized constants for wallet management to avoid magic numbers
 * and improve maintainability.
 *
 * Created: 2025-11-29
 */

// Timeout constants (in milliseconds)
export const API_TIMEOUT_MS = 8000; // 8 seconds for API requests
export const AUTH_TIMEOUT_MS = 15000; // 15 seconds for auth loading

// Business rules
export const MAX_WALLETS_PER_ENTITY = 10;
export const MAX_LABEL_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;

// Database error codes
export const POSTGRES_TABLE_NOT_FOUND = '42P01';

// Fallback storage key for wallets in profile metadata
export const FALLBACK_WALLETS_KEY = 'legacy_wallets';
