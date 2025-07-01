/**
 * PROFILE TYPES MODULE
 * 
 * Created: 2025-01-09
 * Last Modified: 2025-01-09
 * Last Modified Summary: Extracted from profileService.ts (808 lines) for modular architecture
 */

import type { Profile, ProfileFormData } from '@/types/database'

// =====================================================================
// 🎯 SCALABLE PROFILE INTERFACE (CURRENT SCHEMA COMPATIBLE)
// =====================================================================

export interface ScalableProfile extends Profile {
  // Core fields (existing in database)
  id: string
  username: string | null
  full_name: string | null  // Maps to display_name
  avatar_url: string | null
  website: string | null
  created_at: string
  updated_at: string
  
  // Virtual fields (computed from JSON or other sources)
  display_name: string | null  // Mapped from full_name
  bio: string | null
  banner_url: string | null
  bitcoin_address: string | null
  lightning_address: string | null
  
  // Extended fields (stored in JSON or computed)
  email: string | null
  phone: string | null
  location: string | null
  timezone: string | null
  language: string | null
  currency: string | null
  
  // Bitcoin-native features
  bitcoin_public_key: string | null
  lightning_node_id: string | null
  payment_preferences: Record<string, any> | null
  bitcoin_balance: number | null
  lightning_balance: number | null
  
  // Analytics & Engagement
  profile_views: number | null
  follower_count: number | null
  following_count: number | null
  campaign_count: number | null
  total_raised: number | null
  total_donated: number | null
  
  // Verification & Security
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected' | null
  verification_level: number | null
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected' | null
  two_factor_enabled: boolean | null
  last_login_at: string | null
  login_count: number | null
  
  // Customization & Branding
  theme_preferences: Record<string, any> | null
  custom_css: string | null
  profile_color: string | null
  cover_image_url: string | null
  profile_badges: any[] | null
  
  // Status & Temporal
  status: 'active' | 'inactive' | 'suspended' | 'deleted' | null
  last_active_at: string | null
  profile_completed_at: string | null
  onboarding_completed: boolean | null
  terms_accepted_at: string | null
  privacy_policy_accepted_at: string | null
  
  // Extensibility (JSON fields)
  social_links: Record<string, any> | null
  preferences: Record<string, any> | null
  metadata: Record<string, any> | null
  verification_data: Record<string, any> | null
  privacy_settings: Record<string, any> | null
}

export interface ScalableProfileFormData extends ProfileFormData {
  // All existing fields plus new ones
  email?: string
  phone?: string
  location?: string
  timezone?: string
  language?: string
  currency?: string
  bitcoin_public_key?: string
  lightning_node_id?: string
  payment_preferences?: Record<string, any>
  social_links?: Record<string, any>
  preferences?: Record<string, any>
  theme_preferences?: Record<string, any>
  profile_color?: string
  cover_image_url?: string
  privacy_settings?: Record<string, any>
}

export interface ProfileAnalytics {
  profile_views?: number
  follower_count?: number
  following_count?: number
  campaign_count?: number
  total_raised?: number
  total_donated?: number
}

export interface ProfileServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
} 