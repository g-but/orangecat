/**
 * LEGACY DRAFT MIGRATION UTILITY
 *
 * This module was used to migrate from the old multiple-system approach to the new unified store.
 * The migration has been completed and the old store API no longer exists.
 * These functions are kept as no-ops for backwards compatibility.
 *
 * @deprecated The migration is complete. These functions do nothing.
 */

import { logger } from './logger';

/**
 * @deprecated Migration is complete - this function is now a no-op
 */
export async function migrateLegacyDrafts(_userId: string): Promise<{
  migrated: number;
  recovered: string[];
  errors: string[];
}> {
  logger.info('Legacy draft migration is complete - no action needed');
  return {
    migrated: 0,
    recovered: [],
    errors: [],
  };
}

/**
 * @deprecated Migration is complete - always returns false
 */
export function hasLegacyDrafts(): boolean {
  return false;
}

/**
 * @deprecated Migration is complete - this function is now a no-op
 */
export function clearLegacyLocalStorage(): number {
  return 0;
}

/**
 * @deprecated Migration is complete - this function is now a no-op
 */
export async function recoverDraftFromLocalStorage(
  _userId: string,
  _storageKey: string
): Promise<string | null> {
  logger.info('Legacy draft recovery is no longer available');
  return null;
}

/**
 * @deprecated Migration is complete - this function is now a no-op
 */
export async function recreateMaoDraft(_userId: string): Promise<string> {
  logger.info('recreateMaoDraft is deprecated');
  return '';
}
