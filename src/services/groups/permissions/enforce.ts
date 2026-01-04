/**
 * Permission Enforcement Middleware
 *
 * Enforces permissions with "requires vote" flow support.
 * Follows the Network State Development Guide Phase 6.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial implementation
 */

import { canPerformAction, type PermissionResult } from './resolver';
import { logger } from '@/utils/logger';

export interface EnforcePermissionResult {
  allowed: boolean;
  requiresVote: boolean;
  error?: string;
  reason?: string;
}

/**
 * Enforce permission with "requires vote" flow support
 *
 * @param userId - User attempting the action
 * @param groupId - Group ID (null = user acting as self)
 * @param action - Action to check
 * @returns EnforcePermissionResult with allowed, requiresVote, and error
 */
export async function enforcePermission(
  userId: string,
  groupId: string | null,
  action: string
): Promise<EnforcePermissionResult> {
  try {
    const result: PermissionResult = await canPerformAction(userId, groupId, action as any);

    if (result.allowed) {
      return {
        allowed: true,
        requiresVote: false,
      };
    }

    if (result.requiresVote) {
      return {
        allowed: false,
        requiresVote: true,
        error: 'This action requires a proposal and vote',
        reason: result.reason,
      };
    }

    return {
      allowed: false,
      requiresVote: false,
      error: result.reason || 'Permission denied',
      reason: result.reason,
    };
  } catch (error) {
    logger.error('Exception enforcing permission', error, 'Groups');
    return {
      allowed: false,
      requiresVote: false,
      error: 'Error checking permission',
    };
  }
}

/**
 * Check if action is allowed (throws if not)
 * Use this in service functions that need strict enforcement
 */
export async function requirePermission(
  userId: string,
  groupId: string | null,
  action: string
): Promise<void> {
  const result = await enforcePermission(userId, groupId, action);
  
  if (!result.allowed) {
    if (result.requiresVote) {
      throw new Error('ACTION_REQUIRES_VOTE: This action requires a proposal and vote');
    }
    throw new Error(result.error || 'Permission denied');
  }
}

