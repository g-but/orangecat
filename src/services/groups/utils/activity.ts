/**
 * Groups Service Activity Logging
 *
 * Activity logging utilities for groups.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created activity logging utilities
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { ActivityType } from '../types';
import { TABLES } from '../constants';
import type { SupabaseClient } from '@supabase/supabase-js';

// Type alias for any SupabaseClient (accepts any database schema)
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Log group activity
 * @param metadata - Can include related_wallet_id, related_project_id, etc. plus any extra keys
 * @param client - Optional Supabase client override
 */
export async function logGroupActivity(
  groupId: string,
  userId: string,
  activityType: ActivityType,
  description: string,
  metadata?: {
    related_wallet_id?: string;
    related_project_id?: string;
    related_loan_id?: string;
    related_proposal_id?: string;
    related_amount_sats?: number;
    [key: string]: unknown;
  },
  client?: AnySupabaseClient
): Promise<void> {
  try {
    const supabaseClient = client || supabase;
    await (supabaseClient.from(TABLES.group_activities) as any).insert({
      group_id: groupId,
      user_id: userId,
      activity_type: activityType,
      description,
      related_wallet_id: metadata?.related_wallet_id || null,
      related_project_id: metadata?.related_project_id || null,
      related_loan_id: metadata?.related_loan_id || null,
      related_proposal_id: metadata?.related_proposal_id || null,
      related_amount_sats: metadata?.related_amount_sats || null,
      metadata: metadata || {},
    });
  } catch (error) {
    logger.error('Failed to log group activity', error, 'Groups');
    // Don't throw - activity logging is non-critical
  }
}
