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
import { ProfileService } from '@/services/profile'
export { ProfileService }

// For backwards compatibility, export profile functions individually
export const getProfile = ProfileService.getProfile.bind(ProfileService)
export const updateProfile = ProfileService.updateProfile.bind(ProfileService)
export const createProfile = ProfileService.createProfile.bind(ProfileService)
export const getProfiles = ProfileService.getProfiles.bind(ProfileService)
export const searchProfiles = ProfileService.searchProfiles.bind(ProfileService)
export const getAllProfiles = ProfileService.getAllProfiles.bind(ProfileService)
export const incrementProfileViews = ProfileService.incrementProfileViews.bind(ProfileService)
export const updateAnalytics = ProfileService.updateAnalytics.bind(ProfileService)
export const deleteProfile = ProfileService.deleteProfile.bind(ProfileService)
export const fallbackProfileUpdate = ProfileService.fallbackProfileUpdate.bind(ProfileService)

// Mock functions for backwards compatibility
export const isUsernameAvailable = async (username: string) => true
export const getProfileByUsername = async (username: string) => null
export const validateProfileData = async (data: any) => ({ success: true })

// Import and re-export core clients
import { supabase, supabaseAdmin, supabaseConfig } from '@/services/supabase/core/client'
export { supabase, supabaseAdmin, supabaseConfig }
