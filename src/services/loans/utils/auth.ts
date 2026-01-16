/**
 * LOANS SERVICE - Authentication Utilities
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from loans/index.ts for modularity
 */

import supabase from '@/lib/supabase/browser';

/**
 * Get current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}
