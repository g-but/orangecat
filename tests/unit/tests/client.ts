/**
 * TEST CLIENT - BACKWARDS COMPATIBILITY FOR TESTS
 *
 * This file provides backwards compatibility for tests that expect
 * a unified client that re-exports all services.
 */

// Re-export auth service
export {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  getUser,
  onAuthStateChange,
  isAuthenticated,
  getCurrentUserId
} from '@/services/supabase/auth'

// Re-export profile service
export { ProfileService } from '@/services/profile'

// Re-export core clients
export { supabase, supabaseAdmin, supabaseConfig } from '@/services/supabase/core/client'
