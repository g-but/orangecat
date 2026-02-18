/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CONSOLIDATED SUPABASE SERVICE LAYER
 *
 * This service consolidates all database operations into a single,
 * clean, maintainable interface that eliminates overlapping patterns
 * and provides consistent error handling.
 *
 * Created: 2025-06-30
 * Purpose: Replace multiple overlapping service patterns with single clean interface
 */

import { supabase } from './client';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

// =====================================================================
// 🎯 UNIFIED TYPES
// =====================================================================

export interface DatabaseProfile {
  id: string;
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  website?: string | null;
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error' | 'not_found';
}

export interface ProfileUpdateData {
  username?: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  website?: string;
  bitcoin_address?: string;
  lightning_address?: string;
}

// =====================================================================
// 🔧 PROFILE OPERATIONS
// =====================================================================

export class ProfileService {
  /**
   * Get profile by user ID
   */
  static async getProfile(userId: string): Promise<ServiceResponse<DatabaseProfile>> {
    if (!userId?.trim()) {
      return { data: null, error: 'User ID is required', status: 'error' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: null, status: 'not_found' };
        }
        logger.error('Profile fetch error:', error);
        return { data: null, error: error.message, status: 'error' };
      }

      return { data, error: null, status: 'success' };
    } catch (err) {
      logger.error('Profile fetch unexpected error:', err);
      return { data: null, error: 'Unexpected error occurred', status: 'error' };
    }
  }

  /**
   * Update profile
   */
  static async updateProfile(
    userId: string,
    updates: ProfileUpdateData
  ): Promise<ServiceResponse<DatabaseProfile>> {
    if (!userId?.trim()) {
      return { data: null, error: 'User ID is required', status: 'error' };
    }

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return { data: null, error: 'Authentication required', status: 'error' };
    }

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { data: null, error: 'Username already taken', status: 'error' };
        }
        logger.error('Profile update error:', error);
        return { data: null, error: error.message, status: 'error' };
      }

      return { data, error: null, status: 'success' };
    } catch (err) {
      logger.error('Profile update unexpected error:', err);
      return { data: null, error: 'Unexpected error occurred', status: 'error' };
    }
  }

  /**
   * Create profile
   */
  static async createProfile(
    userId: string,
    profileData: ProfileUpdateData
  ): Promise<ServiceResponse<DatabaseProfile>> {
    if (!userId?.trim()) {
      return { data: null, error: 'User ID is required', status: 'error' };
    }

    try {
      const newProfile = {
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { data: null, error: 'Profile already exists', status: 'error' };
        }
        logger.error('Profile creation error:', error);
        return { data: null, error: error.message, status: 'error' };
      }

      return { data, error: null, status: 'success' };
    } catch (err) {
      logger.error('Profile creation unexpected error:', err);
      return { data: null, error: 'Unexpected error occurred', status: 'error' };
    }
  }

  /**
   * Get profile by username
   */
  static async getProfileByUsername(username: string): Promise<ServiceResponse<DatabaseProfile>> {
    if (!username?.trim()) {
      return { data: null, error: 'Username is required', status: 'error' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
        .select('*')
        .eq('username', username.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: null, status: 'not_found' };
        }
        logger.error('Profile by username fetch error:', error);
        return { data: null, error: error.message, status: 'error' };
      }

      return { data, error: null, status: 'success' };
    } catch (err) {
      logger.error('Profile by username unexpected error:', err);
      return { data: null, error: 'Unexpected error occurred', status: 'error' };
    }
  }

  /**
   * Search profiles
   */
  static async searchProfiles(
    query: string,
    limit: number = 10
  ): Promise<ServiceResponse<DatabaseProfile[]>> {
    if (!query?.trim()) {
      return { data: [], error: null, status: 'success' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
        .select('*')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        logger.error('Profile search error:', error);
        return { data: [], error: error.message, status: 'error' };
      }

      return { data: data || [], error: null, status: 'success' };
    } catch (err) {
      logger.error('Profile search unexpected error:', err);
      return { data: [], error: 'Unexpected error occurred', status: 'error' };
    }
  }
}

// =====================================================================
// 🔧 DATABASE HEALTH CHECK
// =====================================================================

export class DatabaseService {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<ServiceResponse<boolean>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: _data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
        .select('id')
        .limit(1);

      if (error) {
        logger.error('Database connection test failed:', error);
        return { data: false, error: error.message, status: 'error' };
      }

      return { data: true, error: null, status: 'success' };
    } catch (err) {
      logger.error('Database connection test unexpected error:', err);
      return { data: false, error: 'Database connection failed', status: 'error' };
    }
  }

  /**
   * Check schema consistency
   */
  static async checkSchema(): Promise<ServiceResponse<boolean>> {
    try {
      // Test expected columns exist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: _data, error } = await (supabase.from(DATABASE_TABLES.PROFILES) as any)
        .select(
          'id, username, name, bio, avatar_url, banner_url, website, bitcoin_address, lightning_address, created_at, updated_at'
        )
        .limit(1);

      if (error) {
        logger.error('Schema check failed:', error);
        return { data: false, error: 'Schema inconsistency detected', status: 'error' };
      }

      return { data: true, error: null, status: 'success' };
    } catch (err) {
      logger.error('Schema check unexpected error:', err);
      return { data: false, error: 'Schema check failed', status: 'error' };
    }
  }
}

// Note: Types DatabaseProfile, ServiceResponse, and ProfileUpdateData are already exported above
