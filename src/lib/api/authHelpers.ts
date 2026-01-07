/**
 * Authentication Helper Utilities
 *
 * Shared utilities for authentication and authorization checks in API handlers.
 * Promotes consistency and reduces duplication.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Initial creation of auth helper utilities
 */

import { createServerClient } from '@/lib/supabase/server';

/**
 * Check if user should see drafts for a specific user ID
 *
 * @param requestedUserId - User ID from query params
 * @param authenticatedUserId - Currently authenticated user ID
 * @returns Whether to include drafts
 */
export async function shouldIncludeDrafts(
  requestedUserId: string | null,
  authenticatedUserId?: string | null
): Promise<boolean> {
  if (!requestedUserId || !authenticatedUserId) {return false;}
  return requestedUserId === authenticatedUserId;
}

/**
 * Get authenticated user ID
 *
 * @returns User ID or null if not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}



