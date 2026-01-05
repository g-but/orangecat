/**
 * @deprecated This file is deprecated. Use @/services/supabase/auth instead.
 * 
 * This file re-exports from the centralized auth service for backward compatibility.
 * All authentication operations should use the service layer for proper error handling,
 * timeout protection, and logging.
 *
 * Created: Unknown
 * Last Modified: 2026-01-30
 * Last Modified Summary: Deprecated - now re-exports from centralized auth service
 */

// Re-export from centralized auth service
export {
  signIn,
  signUp,
  signOut,
  getUser as getCurrentUser,
} from '@/services/supabase/auth';

// Legacy function signature compatibility
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getUser } from '@/services/supabase/auth';
import type { User } from '@supabase/supabase-js';

/**
 * @deprecated Use getUser() from @/services/supabase/auth instead
 */
export async function getCurrentUser(): Promise<User | null> {
  const { user } = await getUser();
  return user;
}

/**
 * @deprecated Use signIn({ email, password }) from @/services/supabase/auth instead
 */
export async function signIn(email: string, password: string) {
  const result = await authSignIn({ email, password });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data;
}

/**
 * @deprecated Use signUp({ email, password, emailRedirectTo? }) from @/services/supabase/auth instead
 */
export async function signUp(email: string, password: string, metadata?: any) {
  const result = await authSignUp({ 
    email, 
    password,
    // Note: metadata should be handled via profile creation, not auth metadata
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data;
}

/**
 * @deprecated Use signOut() from @/services/supabase/auth instead
 */
export async function signOut() {
  const { error } = await authSignOut();
  if (error) {
    throw new Error(error.message);
  }
}
