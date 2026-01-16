/**
 * Audit Logging System
 *
 * Tracks critical operations for security, compliance, and debugging.
 * Week 3 Improvement: Centralized audit logging for all sensitive operations
 *
 * Usage:
 * ```typescript
 * await auditLog({
 *   action: 'WALLET_CREATED',
 *   userId: user.id,
 *   entityType: 'wallet',
 *   entityId: wallet.id,
 *   metadata: { address: wallet.address_or_xpub, category: wallet.category }
 * });
 * ```
 */

import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

/**
 * Audit action types - add more as needed
 */
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTERED: 'USER_REGISTERED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',

  // Profile
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_DELETED: 'PROFILE_DELETED',

  // Projects
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_PUBLISHED: 'PROJECT_PUBLISHED',
  PROJECT_UNPUBLISHED: 'PROJECT_UNPUBLISHED',

  // Wallets
  WALLET_CREATED: 'WALLET_CREATED',
  WALLET_UPDATED: 'WALLET_UPDATED',
  WALLET_DELETED: 'WALLET_DELETED',
  WALLET_BALANCE_REFRESHED: 'WALLET_BALANCE_REFRESHED',

  // Social
  USER_FOLLOWED: 'USER_FOLLOWED',
  USER_UNFOLLOWED: 'USER_UNFOLLOWED',

  // Donations
  DONATION_INITIATED: 'DONATION_INITIATED',
  DONATION_COMPLETED: 'DONATION_COMPLETED',
  DONATION_FAILED: 'DONATION_FAILED',

  // Admin
  ADMIN_ACTION: 'ADMIN_ACTION',
  PERMISSIONS_CHANGED: 'PERMISSIONS_CHANGED',

  // Security
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  action: AuditAction;
  userId: string | null;
  entityType?: 'profile' | 'project' | 'wallet' | 'post' | 'donation' | 'other';
  entityId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Create audit log entry
 *
 * @param entry - Audit log entry data
 * @returns Promise that resolves when log is created
 *
 * @example
 * await auditLog({
 *   action: 'WALLET_CREATED',
 *   userId: user.id,
 *   entityType: 'wallet',
 *   entityId: newWallet.id,
 *   metadata: { address: newWallet.address_or_xpub }
 * });
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createServerClient();

    // Create audit log entry in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('audit_logs') as any).insert({
      action: entry.action,
      user_id: entry.userId,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      metadata: entry.metadata || {},
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      success: entry.success ?? true,
      error_message: entry.errorMessage,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // If audit logging fails, log to console but don't fail the operation
      logger.error('Failed to create audit log', {
        action: entry.action,
        userId: entry.userId,
        error: error.message,
      });
    } else {
      // Also log to structured logger for real-time monitoring
      logger.info('Audit log created', {
        action: entry.action,
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
      });
    }
  } catch (error) {
    // Never throw errors from audit logging - it should not break the main operation
    logger.error('Unexpected error in audit logging', { error });
  }
}

/**
 * Simplified audit log for successful operations
 */
export async function auditSuccess(
  action: AuditAction,
  userId: string,
  entityType?: AuditLogEntry['entityType'],
  entityId?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
): Promise<void> {
  return auditLog({
    action,
    userId,
    entityType,
    entityId,
    metadata,
    success: true,
  });
}

/**
 * Simplified audit log for failed operations
 */
export async function auditFailure(
  action: AuditAction,
  userId: string | null,
  errorMessage: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
): Promise<void> {
  return auditLog({
    action,
    userId,
    metadata,
    success: false,
    errorMessage,
  });
}

/**
 * Audit log with request context (IP, user agent)
 */
export async function auditWithContext(entry: AuditLogEntry, request: Request): Promise<void> {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  return auditLog({
    ...entry,
    ipAddress: ipAddress || undefined,
    userAgent: userAgent || undefined,
  });
}

/**
 * Query audit logs (for admin dashboard)
 *
 * @param filters - Filter criteria
 * @returns Audit log entries matching filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const supabase = await createServerClient();

    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to query audit logs', { error: error.message, filters });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Unexpected error querying audit logs', { error });
    return [];
  }
}
