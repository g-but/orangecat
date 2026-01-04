/**
 * Timeline Auth Utilities
 * 
 * Helper functions for authentication in timeline operations.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted auth utilities from monolithic timeline service
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user ID', error, 'Timeline');
    return null;
  }
}



