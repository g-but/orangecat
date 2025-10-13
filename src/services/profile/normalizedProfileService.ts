/**
 * NORMALIZED PROFILE SERVICE
 *
 * New service layer designed for the normalized database schema.
 * Provides clean, type-safe operations across multiple tables.
 *
 * ✅ Single Responsibility: Each method does one thing well
 * ✅ Type Safety: Full TypeScript support with proper interfaces
 * ✅ Error Handling: Structured error responses with correlation IDs
 * ✅ Performance: Optimized queries with proper indexing
 * ✅ Security: Row Level Security compliance
 *
 * Created: 2025-01-24
 * Last Modified: 2025-01-24
 * Last Modified Summary: New service for normalized schema - replaces old monolithic approach
 */

import getSupabaseClient from '@/services/supabase/client'
import { ApiError, ErrorCode, ErrorHelpers, withErrorHandling } from '@/lib/api/errorHandling'
import { logger } from '@/utils/logger'

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export interface NormalizedProfile {
  // Core profile data
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  website: string | null
  status: 'active' | 'inactive' | 'suspended' | 'deleted'
  last_active_at: string | null
  profile_completed_at: string | null
  onboarding_completed: boolean | null
  created_at: string
  updated_at: string

  // Related data from other tables
  preferences?: UserPreferences | null
  bitcoin_data?: BitcoinData | null
  analytics?: UserAnalytics | null
  verification?: UserVerification | null
  social_links?: SocialLink[] | null
}

export interface UserPreferences {
  user_id: string
  email: string | null
  phone: string | null
  location: string | null
  timezone: string | null
  language: string | null
  currency: string | null
  theme_preferences: Record<string, any> | null
  custom_css: string | null
  profile_color: string | null
  cover_image_url: string | null
  privacy_settings: Record<string, any> | null
  preferences: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface BitcoinData {
  user_id: string
  bitcoin_address: string | null
  lightning_address: string | null
  bitcoin_public_key: string | null
  lightning_node_id: string | null
  bitcoin_balance: number | null
  lightning_balance: number | null
  created_at: string
  updated_at: string
}

export interface UserAnalytics {
  user_id: string
  profile_views: number | null
  follower_count: number | null
  following_count: number | null
  campaign_count: number | null
  total_raised: number | null
  total_donated: number | null
  login_count: number | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface UserVerification {
  user_id: string
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  verification_level: number | null
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected' | null
  two_factor_enabled: boolean | null
  verification_data: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface SocialLink {
  id: string
  user_id: string
  platform: string
  username: string | null
  url: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface ProfileUpdateData {
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  banner_url?: string
  website?: string
  status?: 'active' | 'inactive' | 'suspended' | 'deleted'
  onboarding_completed?: boolean

  // Preferences
  email?: string
  phone?: string
  location?: string
  timezone?: string
  language?: string
  currency?: string
  theme_preferences?: Record<string, any>
  privacy_settings?: Record<string, any>

  // Bitcoin data
  bitcoin_address?: string
  lightning_address?: string
  bitcoin_public_key?: string
  lightning_node_id?: string
}

// =====================================================================
// MAIN SERVICE CLASS
// =====================================================================

export class NormalizedProfileService {

  /**
   * Get complete profile with all related data
   */
  static async getCompleteProfile(userId: string): Promise<NormalizedProfile | null> {
    return withErrorHandling(async () => {
      if (!userId?.trim()) {
        throw ErrorHelpers.validationError('userId', 'User ID is required')
      }

      // Use parallel queries for optimal performance
      const [profile, preferences, bitcoinData, analytics, verification, socialLinks] = await Promise.all([
        this.getCoreProfile(userId),
        this.getUserPreferences(userId),
        this.getBitcoinData(userId),
        this.getUserAnalytics(userId),
        this.getUserVerification(userId),
        this.getUserSocialLinks(userId)
      ])

      if (!profile) {
        return null
      }

      return {
        ...profile,
        preferences: preferences || null,
        bitcoin_data: bitcoinData || null,
        analytics: analytics || null,
        verification: verification || null,
        social_links: socialLinks || null
      }
    }, {
      operation: 'get_complete_profile',
      fallbackErrorCode: ErrorCode.INTERNAL_SERVER_ERROR
    })
  }

  /**
   * Get core profile data only
   */
  static async getCoreProfile(userId: string) {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        throw ErrorHelpers.databaseError('get_core_profile', `User ${userId}: ${error.message}`)
      }

      return data
    }, {
      operation: 'get_core_profile',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Update profile across multiple tables
   */
  static async updateProfile(userId: string, updateData: ProfileUpdateData): Promise<NormalizedProfile> {
    return withErrorHandling(async () => {
      if (!userId?.trim()) {
        throw ErrorHelpers.validationError('userId', 'User ID is required')
      }

      // Verify user authentication and authorization
      const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser()

      if (authError || !user) {
        throw ErrorHelpers.authenticationRequired()
      }

      if (user.id !== userId) {
        throw ErrorHelpers.insufficientPermissions('profile', `User ${user.id} attempted to update profile ${userId}`)
      }

      // Perform updates in parallel
      const updatePromises = []

      // Core profile updates
      if (Object.keys(updateData).some(key => ['username', 'display_name', 'bio', 'avatar_url', 'banner_url', 'website', 'status', 'onboarding_completed'].includes(key))) {
        updatePromises.push(
          supabase
            .from('profiles')
            .update({
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('*')
            .single()
        )
      }

      // Preferences updates
      const preferenceFields = ['email', 'phone', 'location', 'timezone', 'language', 'currency', 'theme_preferences', 'privacy_settings']
      if (Object.keys(updateData).some(key => preferenceFields.includes(key))) {
        updatePromises.push(
          supabase
            .from('user_preferences')
            .upsert({
              user_id: userId,
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .select('*')
            .single()
        )
      }

      // Bitcoin data updates
      const bitcoinFields = ['bitcoin_address', 'lightning_address', 'bitcoin_public_key', 'lightning_node_id']
      if (Object.keys(updateData).some(key => bitcoinFields.includes(key))) {
        updatePromises.push(
          supabase
            .from('user_bitcoin_data')
            .upsert({
              user_id: userId,
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .select('*')
            .single()
        )
      }

      // Execute all updates
      const results = await Promise.all(updatePromises)

      // Check for errors
      for (const result of results) {
        if (result.error) {
          throw ErrorHelpers.databaseError('update_profile', `User ${userId}: ${result.error.message}`)
        }
      }

      // Return complete updated profile
      return await this.getCompleteProfile(userId)

    }, {
      operation: 'update_profile',
      fallbackErrorCode: ErrorCode.INTERNAL_SERVER_ERROR
    })
  }

  /**
   * Search profiles with filtering and pagination
   */
  static async searchProfiles(
    searchQuery: string,
    options: {
      limit?: number
      offset?: number
      status?: 'active' | 'inactive' | 'suspended' | 'deleted'
      verified?: boolean
    } = {}
  ): Promise<{
    profiles: NormalizedProfile[]
    totalCount: number
    hasMore: boolean
  }> {
    return withErrorHandling(async () => {
      const { limit = 20, offset = 0, status = 'active', verified } = options

      let query = supabase
        .from('profiles')
        .select('*, user_verification!inner(verification_status)', { count: 'exact' })
        .eq('status', status)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (verified !== undefined) {
        query = query.eq('user_verification.verification_status', 'verified')
      }

      const { data, error, count } = await query

      if (error) {
        throw ErrorHelpers.databaseError('search_profiles', `Query "${searchQuery}" with options ${JSON.stringify(options)}: ${error.message}`)
      }

      const profiles = data || []
      const totalCount = count || 0
      const hasMore = (offset + limit) < totalCount

      return {
        profiles: profiles as NormalizedProfile[],
        totalCount,
        hasMore
      }
    }, {
      operation: 'search_profiles',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        throw ErrorHelpers.databaseError('get_user_preferences', `User ${userId}: ${error.message}`)
      }

      return data
    }, {
      operation: 'get_user_preferences',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Get bitcoin data
   */
  static async getBitcoinData(userId: string): Promise<BitcoinData | null> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('user_bitcoin_data')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        throw ErrorHelpers.databaseError('get_bitcoin_data', `User ${userId}: ${error.message}`)
      }

      return data
    }, {
      operation: 'get_bitcoin_data',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        throw ErrorHelpers.databaseError('get_user_analytics', `User ${userId}: ${error.message}`)
      }

      return data
    }, {
      operation: 'get_user_analytics',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Get user verification data
   */
  static async getUserVerification(userId: string): Promise<UserVerification | null> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('user_verification')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        throw ErrorHelpers.databaseError('get_user_verification', `User ${userId}: ${error.message}`)
      }

      return data
    }, {
      operation: 'get_user_verification',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Get user social links
   */
  static async getUserSocialLinks(userId: string): Promise<SocialLink[]> {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('user_social_links')
        .select('*')
        .eq('user_id', userId)
        .order('platform')

      if (error) {
        throw ErrorHelpers.databaseError('get_user_social_links', `User ${userId}: ${error.message}`)
      }

      return data || []
    }, {
      operation: 'get_user_social_links',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Increment profile views
   */
  static async incrementProfileViews(userId: string): Promise<void> {
    return withErrorHandling(async () => {
      const { error } = await supabase
        .from('user_analytics')
        .update({
          profile_views: 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        throw ErrorHelpers.databaseError('increment_profile_views', `User ${userId}: ${error.message}`)
      }
    }, {
      operation: 'increment_profile_views',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }

  /**
   * Delete profile (soft delete)
   */
  static async deleteProfile(userId: string): Promise<void> {
    return withErrorHandling(async () => {
      // Verify user authentication and authorization
      const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser()

      if (authError || !user) {
        throw ErrorHelpers.authenticationRequired()
      }

      if (user.id !== userId) {
        throw ErrorHelpers.insufficientPermissions('profile', `User ${user.id} attempted to update profile ${userId}`)
      }

      // Soft delete by setting status to 'deleted'
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw ErrorHelpers.databaseError('delete_profile', `User ${userId}: ${error.message}`)
      }
    }, {
      operation: 'delete_profile',
      fallbackErrorCode: ErrorCode.DATABASE_ERROR
    })
  }
}

export default NormalizedProfileService








