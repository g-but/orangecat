/**
 * Wallet Type Definitions
 *
 * Type definitions for wallet-related data structures.
 *
 * Created: 2025-11-29
 */

import type { Wallet } from '@/types/wallet';

/**
 * Profile metadata structure for fallback wallet storage
 */
export interface ProfileMetadata {
  legacy_wallets?: Wallet[];
  [key: string]: unknown;
}

/**
 * Supabase error structure
 */
export interface SupabaseError {
  code?: string;
  message?: string;
  hint?: string;
  details?: string;
}

/**
 * Type guard for Supabase errors
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error || 'hint' in error)
  );
}

/**
 * Type guard for profile metadata
 */
export function isProfileMetadata(metadata: unknown): metadata is ProfileMetadata {
  return typeof metadata === 'object' && metadata !== null;
}
