/**
 * PROFILE READER MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from profileService.ts for modular architecture - handles read operations
 */

import supabase from '@/services/supabase/client'
import { logger, logProfile } from '@/utils/logger'
import { ProfileMapper } from './mapper'
import type { ScalableProfile } from './types'

// =====================================================================
// 📖 PROFILE RETRIEVAL OPERATIONS
// =====================================================================

export class ProfileReader {
  
  /**
   * Get a complete profile with all scalable fields
   */
  static async getProfile(userId: string): Promise<ScalableProfile | null> {
    if (!userId?.trim()) {
      logger.warn('ProfileReader.getProfile: Empty user ID provided')
      return null
    }

    try {
      logProfile('getProfile', { userId })

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.info(`Profile not found for user: ${userId}`)
          return null
        }
        logger.error('ProfileReader.getProfile error:', error)
        return null
      }

      if (!data) {
        return null
      }

      const profile = ProfileMapper.mapDatabaseToProfile(data);
      logProfile('getProfile success', { userId, hasProfile: true })
      return profile

    } catch (err) {
      logger.error('ProfileReader.getProfile unexpected error:', err)
      return null
    }
  }

  /**
   * Get multiple profiles with pagination and filtering
   */
  static async getProfiles(options: {
    limit?: number
    offset?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  } = {}): Promise<ScalableProfile[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.error('ProfileReader.getProfiles error:', { message: error.message, code: error.code })
        return []
      }

      return data?.map(profile => ProfileMapper.mapDatabaseToProfile(profile)) || []

    } catch (err) {
      logger.error('ProfileReader.getProfiles unexpected error:', err)
      return []
    }
  }

  /**
   * Search profiles with basic text search
   */
  static async searchProfiles(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ScalableProfile[]> {
    if (!searchTerm?.trim()) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.error('ProfileReader.searchProfiles error:', error)
        return []
      }

      return data?.map(profile => ProfileMapper.mapDatabaseToProfile(profile)) || []

    } catch (err) {
      logger.error('ProfileReader.searchProfiles unexpected error:', err)
      return []
    }
  }

  /**
   * Get all profiles (admin function)
   */
  static async getAllProfiles(): Promise<ScalableProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('ProfileReader.getAllProfiles error:', error)
        return []
      }

      return data?.map(profile => ProfileMapper.mapDatabaseToProfile(profile)) || []

    } catch (err) {
      logger.error('ProfileReader.getAllProfiles unexpected error:', err)
      return []
    }
  }

  /**
   * Increment profile views (read-adjacent operation)
   */
  static async incrementProfileViews(userId: string): Promise<void> {
    if (!userId?.trim()) {return}

    try {
      // Get current view count
      const profile = await this.getProfile(userId)
      if (!profile) {return}

      const currentViews = profile.profile_views || 0
      
      // Update view count
      await supabase
        .from('profiles')
        .update({ 
          website: JSON.stringify({
            ...JSON.parse(profile.website || '{}'),
            profile_views: currentViews + 1,
            last_viewed_at: new Date().toISOString()
          })
        })
        .eq('id', userId)

    } catch (err) {
      logger.error('ProfileReader.incrementProfileViews error:', err)
    }
  }
} 